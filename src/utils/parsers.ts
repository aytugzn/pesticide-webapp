import type {
  AppImage,
  SiteImageSlideDoc,
  PestDoc,
  RegionDoc,
  SettingsDoc,
  CombinationDoc,
} from "@/types";
import type { GoogleReviewDoc } from "@/features/home/types";
import { AppError } from "@/lib/exceptions";
import { DICTIONARY } from "@/constants/dictionary";
import {
  GOOGLE_PLACE_ID_MAX_LENGTH,
  SLIDER_AUTOPLAY_DELAY_MAX_SECONDS,
  SLIDER_AUTOPLAY_DELAY_MIN_SECONDS,
} from "@/features/settings/constants";
import { normalizeTurkishPhone } from "@/utils/phone";

/**
 * Parses a non-empty string while removing surrounding whitespace.
 *
 * @param value - Unknown raw value
 * @returns The trimmed string, or undefined for empty and non-string input
 */
const parseTrimmedString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

/**
 * Treats Google Place ID as an opaque trimmed identifier with a safety cap.
 *
 * @param value - Unknown published Place ID value
 * @returns A trimmed identifier within the technical limit, or undefined
 */
const parseGooglePlaceId = (value: unknown): string | undefined => {
  const placeId = parseTrimmedString(value);
  return placeId && placeId.length <= GOOGLE_PLACE_ID_MAX_LENGTH
    ? placeId
    : undefined;
};

/**
 * Parses a conservative public-safe email value.
 *
 * @param value - Unknown published email value
 * @returns A trimmed email with a basic valid shape, or undefined
 */
const parseSafeEmail = (value: unknown): string | undefined => {
  const email = parseTrimmedString(value);
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? email
    : undefined;
};

/**
 * Parses an HTTPS social URL restricted to an allowlisted host.
 *
 * @param value - Unknown published social URL
 * @param allowedHosts - Accepted root domains
 * @returns A normalized URL, an intentional empty string, or undefined
 */
const parseSafeSocialUrl = (
  value: unknown,
  allowedHosts: readonly string[],
): string | undefined => {
  if (typeof value !== "string") return undefined;
  const rawUrl = value.trim();
  if (!rawUrl) return "";

  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    return url.protocol === "https:" &&
      allowedHosts.some(
        (host) => hostname === host || hostname.endsWith(`.${host}`),
      )
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Parses legacy numeric strings and canonical slider-delay numbers.
 *
 * @param value - Unknown numeric delay value
 * @returns A bounded integer delay, or undefined
 */
const parseSliderDelay = (value: unknown): number | undefined => {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number(value)
        : Number.NaN;

  return Number.isInteger(parsedValue) &&
    parsedValue >= SLIDER_AUTOPLAY_DELAY_MIN_SECONDS &&
    parsedValue <= SLIDER_AUTOPLAY_DELAY_MAX_SECONDS
    ? parsedValue
    : undefined;
};

/**
 * Parses a future object-based Cloudinary image reference from Firestore data.
 *
 * @param data - Raw image reference
 * @returns A validated AppImage, or undefined when required fields are invalid
 */
export const parseAppImage = (
  data: unknown,
  fallbackAlt = "",
): AppImage | undefined => {
  if (!data || typeof data !== "object") return undefined;

  const image = data as Record<string, unknown>;
  const publicId =
    typeof image.publicId === "string" ? image.publicId.trim() : "";
  const alt =
    typeof image.alt === "string" && image.alt.trim()
      ? image.alt.trim()
      : fallbackAlt.trim();

  if (image.source !== "cloudinary" || !publicId || !alt) return undefined;

  return {
    source: "cloudinary",
    publicId,
    alt,
    ...(typeof image.assetId === "string" && image.assetId.trim()
      ? { assetId: image.assetId.trim() }
      : {}),
    ...(typeof image.version === "number" &&
    Number.isInteger(image.version) &&
    image.version > 0
      ? { version: image.version }
      : {}),
    ...(typeof image.originalUrl === "string" && image.originalUrl.trim()
      ? { originalUrl: image.originalUrl.trim() }
      : {}),
    ...(typeof image.width === "number" &&
    Number.isFinite(image.width) &&
    image.width > 0
      ? { width: image.width }
      : {}),
    ...(typeof image.height === "number" &&
    Number.isFinite(image.height) &&
    image.height > 0
      ? { height: image.height }
      : {}),
    ...(typeof image.format === "string" && image.format.trim()
      ? { format: image.format.trim() }
      : {}),
  };
};

/**
 * Parses and validates raw Firestore data into a SettingsDoc.
 *
 * @param data - Raw data from Firestore
 * @returns Type-safe SettingsDoc object
 */
export const parseSettingsDoc = (data: unknown): SettingsDoc => {
  if (!data || typeof data !== "object") return {};

  const d = data as Record<string, unknown>;

  const phone = parseTrimmedString(d.phone);
  const normalizedPhone = phone ? normalizeTurkishPhone(phone) : "";
  return {
    phone: /^\+90[1-9]\d{9}$/.test(normalizedPhone) ? phone : undefined,
    email: parseSafeEmail(d.email),
    address: parseTrimmedString(d.address),
    workingHours: parseTrimmedString(d.workingHours),
    defaultOgImage:
      typeof d.defaultOgImage === "string" ? d.defaultOgImage : undefined,
    whyUsImage: parseAppImage(d.whyUsImage),
    whyUsSlides: Array.isArray(d.whyUsSlides)
      ? parseSiteImageSlides(d.whyUsSlides)
      : undefined,
    servicesImage: parseAppImage(d.servicesImage),
    servicesSlides: Array.isArray(d.servicesSlides)
      ? parseSiteImageSlides(d.servicesSlides)
      : undefined,
    heroAutoplayDelay: parseSliderDelay(d.heroAutoplayDelay),
    servicesAutoplayDelay: parseSliderDelay(d.servicesAutoplayDelay),
    whyUsAutoplayDelay: parseSliderDelay(d.whyUsAutoplayDelay),
    reviewsAutoplayDelay: parseSliderDelay(d.reviewsAutoplayDelay),
    googlePlaceId: parseGooglePlaceId(d.googlePlaceId),
    instagramUrl: parseSafeSocialUrl(d.instagramUrl, ["instagram.com"]),
    facebookUrl: parseSafeSocialUrl(d.facebookUrl, [
      "facebook.com",
      "fb.com",
    ]),
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
    cardDescription: d.cardDescription
      ? String(d.cardDescription)
      : undefined,
    image: parseAppImage(d.image),
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
    cardDescription: d.cardDescription
      ? String(d.cardDescription)
      : undefined,
    image: parseAppImage(d.image),
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
    isArchived: typeof d.isArchived === "boolean" ? d.isArchived : undefined,
    archivedAt: typeof d.archivedAt === "number" ? d.archivedAt : undefined,
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
export const parseSiteImageSlideDoc = (
  data: unknown,
  fallbackOrder: number,
): SiteImageSlideDoc | null => {
  if (!data || typeof data !== "object") return null;

  const d = data as Record<string, unknown>;
  const rawAltText =
    typeof d.altText === "string" && d.altText.trim() ? d.altText.trim() : "";
  const image =
    parseAppImage(d.image, rawAltText) ?? parseAppImage(d, rawAltText);
  const imageUrl = typeof d.imageUrl === "string" ? d.imageUrl.trim() : "";
  if (!image && !imageUrl) return null;

  const rawId = typeof d.id === "string" ? d.id.trim() : "";
  const stableId =
    rawId ||
    image?.assetId ||
    image?.publicId ||
    `legacy-site-image-${fallbackOrder}`;

  return {
    id: stableId,
    image,
    imageUrl: imageUrl || undefined,
    altText: rawAltText || image?.alt || "",
    order:
      typeof d.order === "number" &&
      Number.isInteger(d.order) &&
      d.order >= 0
        ? d.order
        : fallbackOrder,
  };
};

/**
 * Parses a mixed legacy/canonical site-image array without letting one invalid
 * entry discard the remaining usable slides.
 *
 * @param data - Raw Firestore slide array
 * @returns Valid slides ordered by their canonical order field
 */
export const parseSiteImageSlides = (data: unknown): SiteImageSlideDoc[] => {
  if (!Array.isArray(data)) return [];

  return data
    .map((slide, index) => parseSiteImageSlideDoc(slide, index))
    .filter((slide): slide is SiteImageSlideDoc => slide !== null)
    .sort((first, second) => first.order - second.order);
};

export const parseHeroSlideDoc = parseSiteImageSlideDoc;

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
