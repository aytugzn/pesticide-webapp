import "server-only";

import { createHash } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import type { GoogleStatsState } from "@/features/home/types";
import { AppError } from "@/lib/exceptions";
import { fetchWithTimeout } from "@/lib/serverRequest";

const GOOGLE_PLACES_TIMEOUT_MS = 9_000;
const GOOGLE_STATS_SUCCESS_CACHE = {
  stale: 5 * 60,
  revalidate: 6 * 60 * 60,
  expire: 7 * 24 * 60 * 60,
} as const;
const GOOGLE_STATS_EMPTY_CACHE = {
  stale: 30,
  revalidate: 5 * 60,
  expire: 30 * 60,
} as const;

const getGoogleStatsCacheTag = (placeId: string): string => {
  const placeHash = createHash("sha256")
    .update(placeId)
    .digest("hex")
    .slice(0, 20);
  return `google-places-stats:${placeHash}`;
};

/**
 * Fetches and validates one Google Places stats response.
 *
 * @param placeId - Published opaque Google Place ID, when configured
 * @returns A success or valid empty state; provider failures throw safely
 */
const fetchGoogleStats = async (
  placeId: string,
): Promise<GoogleStatsState> => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { status: "error", data: null };
  }

  const response = await fetchWithTimeout(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=tr`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,rating,userRatingCount",
      },
      cache: "no-store",
    },
    GOOGLE_PLACES_TIMEOUT_MS,
    "google-places",
  );

  if (!response.ok) {
    throw new AppError(
      "Google Places request failed",
      "PROVIDER_ERROR",
      { provider: "google-places", status: response.status },
    );
  }

  const rawData: unknown = await response.json();
  const data =
    rawData && typeof rawData === "object"
      ? (rawData as Record<string, unknown>)
      : {};
  if (typeof data.id !== "string" || data.id !== placeId) {
    throw new AppError(
      "Google Places returned an unexpected place identity",
      "PROVIDER_RESPONSE_INVALID",
      { provider: "google-places" },
    );
  }

  const rating = data.rating;
  const reviewCount = data.userRatingCount;
  if (
    rating === undefined ||
    rating === null ||
    reviewCount === undefined ||
    reviewCount === null ||
    reviewCount === 0
  ) {
    return { status: "empty", data: null };
  }

  if (
    typeof rating !== "number" ||
    !Number.isFinite(rating) ||
    rating < 0 ||
    rating > 5 ||
    typeof reviewCount !== "number" ||
    !Number.isSafeInteger(reviewCount) ||
    reviewCount < 0
  ) {
    throw new AppError(
      "Google Places returned invalid rating data",
      "PROVIDER_RESPONSE_INVALID",
      { provider: "google-places" },
    );
  }

  return { status: "success", data: { rating, reviewCount } };
};

/**
 * Caches successful stats for six hours and valid empty responses briefly.
 * The Place ID argument and hashed tag isolate different businesses.
 */
const getCachedGoogleStats = async (
  placeId: string,
): Promise<GoogleStatsState> => {
  "use cache";

  cacheTag(getGoogleStatsCacheTag(placeId));
  const result = await fetchGoogleStats(placeId);
  if (result.status === "success") {
    cacheLife(GOOGLE_STATS_SUCCESS_CACHE);
  } else {
    cacheLife(GOOGLE_STATS_EMPTY_CACHE);
  }
  return result;
};

/**
 * Resolves optional public stats without letting provider failures reject render.
 */
export const getPublicGoogleStats = async (
  placeId?: string,
): Promise<GoogleStatsState> => {
  if (!placeId) return { status: "empty", data: null };
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return { status: "error", data: null };
  }

  try {
    return await getCachedGoogleStats(placeId);
  } catch (error: unknown) {
    console.warn("Google Places request failed", {
      errorCode: error instanceof AppError ? error.code : "UNKNOWN",
    });
    return { status: "error", data: null };
  }
};
