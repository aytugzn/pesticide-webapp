import "server-only";

import { connection } from "next/server";
import type { GoogleStatsState } from "@/features/home/types";

const GOOGLE_PLACES_TIMEOUT_MS = 9_000;

/**
 * Fetches current Google rating data without caching or persistence.
 * Provider failures resolve to a typed state so optional public content never
 * rejects the server-rendered promise. The request boundary keeps configured
 * provider calls out of build-time prerendering.
 *
 * @param placeId - Published opaque Google Place ID, when configured
 * @returns A success, empty, or controlled error state for public rendering
 */
export const getPublicGoogleStats = async (
  placeId?: string,
): Promise<GoogleStatsState> => {
  if (!placeId) return { status: "empty", data: null };

  await connection();

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("Missing Google Places API configuration");
    return { status: "error", data: null };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    GOOGLE_PLACES_TIMEOUT_MS,
  );

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=tr`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "id,rating,userRatingCount",
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      console.warn("Google Places request failed", { status: response.status });
      return { status: "error", data: null };
    }

    const rawData: unknown = await response.json();
    const data =
      rawData && typeof rawData === "object"
        ? (rawData as Record<string, unknown>)
        : {};
    if (typeof data.id !== "string" || data.id !== placeId) {
      console.warn("Google Places returned an unexpected place ID");
      return { status: "error", data: null };
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
      console.warn("Google Places returned invalid rating data");
      return { status: "error", data: null };
    }

    return { status: "success", data: { rating, reviewCount } };
  } catch {
    console.warn("Google Places request timed out or failed");
    return { status: "error", data: null };
  } finally {
    clearTimeout(timeoutId);
  }
};
