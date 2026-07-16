import type { ReviewItem } from "./types";
import { reviewItemSchema } from "./schemas";

/** Returns a normalized HTTPS URL or an empty optional-field value. */
const normalizeOptionalHttpsUrl = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
};

/**
 * Parses one legacy or canonical review while treating invalid optional URLs
 * as absent so a usable review can still render with its existing fallbacks.
 *
 * @param value - Raw Firestore review value
 * @param fallbackId - Stable array-position fallback for legacy entries
 * @returns A canonical review item or null when required copy is invalid
 */
export const parseReviewItem = (
  value: unknown,
  fallbackId: string,
): ReviewItem | null => {
  if (!value || typeof value !== "object") return null;
  const rawItem = value as Record<string, unknown>;
  const parsed = reviewItemSchema.safeParse({
    ...rawItem,
    id: rawItem.id || fallbackId,
    authorName: rawItem.authorName || rawItem.name,
    rating: rawItem.rating ?? 5,
    text: rawItem.text ?? "",
    authorPhotoUrl: normalizeOptionalHttpsUrl(rawItem.authorPhotoUrl),
    reviewUrl: normalizeOptionalHttpsUrl(rawItem.reviewUrl),
  });

  return parsed.success ? parsed.data : null;
};

/**
 * Converts legacy and canonical review arrays into validated review items.
 * Invalid individual entries are omitted without discarding usable siblings.
 *
 * @param value - Raw Firestore review array
 * @returns Valid canonical review items in stored order
 */
export const parseReviewItems = (value: unknown): ReviewItem[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    const parsed = parseReviewItem(item, String(index));
    return parsed ? [parsed] : [];
  });
};

/**
 * Produces Firestore-safe review objects without undefined properties.
 *
 * @param items - Validated canonical review items
 * @returns Serializable ordered review objects
 */
export const serializeReviewItems = (items: ReviewItem[]) =>
  items.map((item) => ({
    id: item.id,
    authorName: item.authorName,
    rating: item.rating,
    text: item.text,
    ...(item.authorPhotoUrl ? { authorPhotoUrl: item.authorPhotoUrl } : {}),
    ...(item.reviewUrl ? { reviewUrl: item.reviewUrl } : {}),
  }));
