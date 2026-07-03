import type { PestDoc, RegionDoc, SettingsDoc, CombinationDoc } from "@/types";
import type { HeroSlideDoc, GoogleReviewDoc } from "@/features/home/types";
import { AppError } from "@/lib/exceptions";
import { DICTIONARY } from "@/constants/dictionary";

/**
 * Parses and validates raw Firestore data into a SettingsDoc.
 *
 * @param data - Raw data from Firestore
 * @returns Type-safe SettingsDoc object
 */
export const parseSettingsDoc = (data: unknown): SettingsDoc => {
  if (!data || typeof data !== "object") return {};

  const d = data as Record<string, unknown>;

  return {
    phone: typeof d.phone === "string" ? d.phone : undefined,
    email: typeof d.email === "string" ? d.email : undefined,
    address: typeof d.address === "string" ? d.address : undefined,
    workingHours:
      typeof d.workingHours === "string" ? d.workingHours : undefined,
    licenseNumber:
      typeof d.licenseNumber === "string" ? d.licenseNumber : undefined,
    defaultOgImage:
      typeof d.defaultOgImage === "string" ? d.defaultOgImage : undefined,
    heroAutoplayDelay:
      typeof d.heroAutoplayDelay === "number" ? d.heroAutoplayDelay : undefined,
    servicesAutoplayDelay:
      typeof d.servicesAutoplayDelay === "number"
        ? d.servicesAutoplayDelay
        : undefined,
    reviewsAutoplayDelay:
      typeof d.reviewsAutoplayDelay === "number"
        ? d.reviewsAutoplayDelay
        : undefined,
    googlePlaceId:
      typeof d.googlePlaceId === "string" ? d.googlePlaceId : undefined,
    instagramUrl:
      typeof d.instagramUrl === "string" ? d.instagramUrl : undefined,
    facebookUrl: typeof d.facebookUrl === "string" ? d.facebookUrl : undefined,
    googleStats:
      d.googleStats && typeof d.googleStats === "object"
        ? {
            rating:
              typeof (d.googleStats as Record<string, unknown>).rating ===
              "string"
                ? ((d.googleStats as Record<string, unknown>).rating as string)
                : "",
            reviewCount:
              typeof (d.googleStats as Record<string, unknown>).reviewCount ===
              "string"
                ? ((d.googleStats as Record<string, unknown>)
                    .reviewCount as string)
                : "",
            lastUpdatedAt:
              typeof (d.googleStats as Record<string, unknown>)
                .lastUpdatedAt === "number"
                ? ((d.googleStats as Record<string, unknown>)
                    .lastUpdatedAt as number)
                : undefined,
          }
        : undefined,
  };
};

/**
 * Parses and validates raw Firestore data into a PestDoc.
 * Ensures default values for required fields.
 *
 * @param data - Raw data from Firestore
 * @returns Type-safe PestDoc object
 */
export const parsePestDoc = (data: unknown): PestDoc => {
  if (!data || typeof data !== "object") {
    return { name: "", slug: "", isActive: false };
  }

  const d = data as Record<string, unknown>;
  let faq: { question: string; answer: string }[] | undefined;
  if (Array.isArray(d.faq)) {
    faq = d.faq
      .filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object",
      )
      .map((item) => ({
        question: String(item.question || ""),
        answer: String(item.answer || ""),
      }));
  }

  return {
    name: String(d.name || ""),
    slug: String(d.slug || ""),
    description: d.description ? String(d.description) : undefined,
    imageUrl: d.imageUrl ? String(d.imageUrl) : undefined,
    isActive: Boolean(d.isActive ?? false),
    title: d.title ? String(d.title) : undefined,
    h1: d.h1 ? String(d.h1) : undefined,
    metaDesc: d.metaDesc ? String(d.metaDesc) : undefined,
    content: d.content ? String(d.content) : undefined,
    faq,
  };
};

/**
 * Parses and validates raw Firestore data into a RegionDoc.
 * Ensures default values for required fields.
 *
 * @param data - Raw data from Firestore
 * @returns Type-safe RegionDoc object
 */
export const parseRegionDoc = (data: unknown): RegionDoc => {
  if (!data || typeof data !== "object") {
    return { name: "", slug: "", isActive: false };
  }

  const d = data as Record<string, unknown>;
  let faq: { question: string; answer: string }[] | undefined;
  if (Array.isArray(d.faq)) {
    faq = d.faq
      .filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object",
      )
      .map((item) => ({
        question: String(item.question || ""),
        answer: String(item.answer || ""),
      }));
  }

  return {
    name: String(d.name || ""),
    slug: String(d.slug || ""),
    description: d.description ? String(d.description) : undefined,
    isActive: Boolean(d.isActive ?? false),
    title: d.title ? String(d.title) : undefined,
    h1: d.h1 ? String(d.h1) : undefined,
    metaDesc: d.metaDesc ? String(d.metaDesc) : undefined,
    content: d.content ? String(d.content) : undefined,
    faq,
  };
};

/**
 * Parses and validates raw Firestore data into a CombinationDoc.
 * Ensures default values for required fields and safely parses the FAQ array.
 *
 * @param data - Raw data from Firestore
 * @returns Type-safe CombinationDoc object
 */
export const parseCombinationDoc = (data: unknown): CombinationDoc => {
  if (!data || typeof data !== "object") {
    return { region: "", pest: "", isActive: false };
  }

  const d = data as Record<string, unknown>;

  let faq: { question: string; answer: string }[] | undefined;
  if (Array.isArray(d.faq)) {
    faq = d.faq
      .filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object",
      )
      .map((item) => ({
        question: String(item.question || ""),
        answer: String(item.answer || ""),
      }));
  }

  return {
    region: String(d.region || ""),
    pest: String(d.pest || ""),
    regionName: d.regionName ? String(d.regionName) : undefined,
    pestName: d.pestName ? String(d.pestName) : undefined,
    title: d.title ? String(d.title) : undefined,
    h1: d.h1 ? String(d.h1) : undefined,
    metaDesc: d.metaDesc ? String(d.metaDesc) : undefined,
    content: d.content ? String(d.content) : undefined,
    faq,
    ogImage: d.ogImage ? String(d.ogImage) : undefined,
    isActive: Boolean(d.isActive ?? false),
  };
};

/**
 * Parses and validates raw Firestore data into a HeroSlideDoc.
 * Slides without a usable image are dropped, since the slider has
 * nothing to render for them.
 *
 * @param data - Raw data from Firestore
 * @param fallbackOrder - Used as the `order` value when the doc has none (e.g. array index)
 * @returns Type-safe HeroSlideDoc object, or null if the slide has no image
 */
export const parseHeroSlideDoc = (
  data: unknown,
  fallbackOrder: number,
): HeroSlideDoc | null => {
  if (!data || typeof data !== "object") return null;

  const d = data as Record<string, unknown>;
  const imageUrl = typeof d.imageUrl === "string" ? d.imageUrl : "";
  if (!imageUrl) return null;

  return {
    id: typeof d.id === "string" ? d.id : undefined,
    imageUrl,
    altText: typeof d.altText === "string" ? d.altText : undefined,
    order: typeof d.order === "number" ? d.order : fallbackOrder,
  };
};

/**
 * Parses and validates raw Firestore data into a GoogleReviewDoc.
 * Reviews without an author name are dropped since there is nothing
 * meaningful to display.
 *
 * @param data - Raw data from Firestore
 * @param fallbackId - Used as the `id` value when the doc has none (e.g. array index)
 * @returns Type-safe GoogleReviewDoc object, or null if required fields are missing
 */
export const parseGoogleReviewDoc = (
  data: unknown,
  fallbackId: number,
): GoogleReviewDoc | null => {
  if (!data || typeof data !== "object") return null;

  const d = data as Record<string, unknown>;
  const authorName = typeof d.authorName === "string" ? d.authorName : "";
  if (!authorName) return null;

  return {
    id: typeof d.id === "string" ? d.id : String(fallbackId),
    authorName,
    rating: typeof d.rating === "number" ? d.rating : 5,
    text: typeof d.text === "string" ? d.text : "",
    authorPhotoUrl:
      typeof d.authorPhotoUrl === "string" ? d.authorPhotoUrl : undefined,
    reviewUrl: typeof d.reviewUrl === "string" ? d.reviewUrl : undefined,
  };
};

/**
 * Robustly extracts and parses JSON from an AI text response.
 * Strips markdown code blocks and handles leading/trailing text.
 *
 * @param text - The raw text response from the AI
 * @returns The parsed JSON object
 * @throws AppError if JSON extraction or parsing fails
 */
export const extractAndParseJson = <T = unknown>(text: string): T => {
  try {
    // 1. Remove markdown code blocks if present (```json ... ```)
    let cleanText = text
      .replace(/```(?:json)?\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // 2. Try to find the first '{' or '[' and the last '}' or ']'
    const firstBrace = cleanText.indexOf("{");
    const firstBracket = cleanText.indexOf("[");

    let startIndex = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIndex = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      startIndex = firstBrace;
    } else if (firstBracket !== -1) {
      startIndex = firstBracket;
    }

    if (startIndex !== -1) {
      const isArray = cleanText[startIndex] === "[";
      const lastIndex = cleanText.lastIndexOf(isArray ? "]" : "}");

      if (lastIndex !== -1 && lastIndex >= startIndex) {
        cleanText = cleanText.substring(startIndex, lastIndex + 1);
      }
    }

    // 3. Sanitize physical control characters (newlines, tabs) that break JSON parsing
    cleanText = cleanText.replace(/[\u0000-\u001F]+/g, " ");

    // 4. Parse the cleaned string
    return JSON.parse(cleanText) as T;
  } catch {
    throw new AppError(
      `${DICTIONARY.systemErrors.api.jsonParseFailed}${text.substring(0, 100)}...`,
      "JSON_PARSE_ERROR",
    );
  }
};
