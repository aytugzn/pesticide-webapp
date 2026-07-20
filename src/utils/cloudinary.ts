import type { AppImage } from "@/types";
import { deepFreeze } from "@/utils/deep-freeze";

export type CloudinaryImagePreset =
  | "hero"
  | "section"
  | "card"
  | "thumbnail"
  | "og";

export type ResolvedAppImage = {
  url: string;
  alt: string;
};

type ResolveAppImageInput = {
  image?: AppImage | null;
  imageUrl?: string | null;
  fallbackAlt: string;
  preset: CloudinaryImagePreset;
};

const CLOUDINARY_TRANSFORMATIONS: Record<CloudinaryImagePreset, string> =
  deepFreeze({
    hero: "f_auto,q_auto,c_fill,g_auto,w_1600,h_1200",
    section: "f_auto,q_auto,c_fill,g_auto,w_1200,h_900",
    card: "f_auto,q_auto,c_fill,g_auto,w_640,h_480",
    thumbnail: "f_auto,q_auto,c_fill,g_auto,w_240,h_180",
    og: "f_auto,q_auto,c_fill,g_auto,w_1200,h_630",
  });

/**
 * Normalizes surrounding whitespace and accidental outer slashes without
 * changing valid Cloudinary folder separators.
 *
 * @param publicId - Raw Cloudinary public ID
 * @returns A normalized public ID, or null when it is empty
 */
export const normalizeCloudinaryPublicId = (
  publicId: string,
): string | null => {
  const normalizedPublicId = publicId.trim().replace(/^\/+|\/+$/g, "");
  return normalizedPublicId || null;
};

/**
 * Builds a client-safe Cloudinary delivery URL for a known transformation preset.
 *
 * @param publicId - Cloudinary public ID, optionally including folder segments
 * @param preset - Centralized delivery transformation preset
 * @param version - Optional positive Cloudinary asset version for cache busting
 * @returns A delivery URL, or null when required public configuration is missing
 */
export const buildCloudinaryUrl = (
  publicId: string,
  preset: CloudinaryImagePreset,
  version?: number,
): string | null => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const normalizedPublicId = normalizeCloudinaryPublicId(publicId);

  if (!cloudName || !normalizedPublicId) return null;

  const encodedCloudName = encodeURIComponent(cloudName);
  const encodedPublicId = normalizedPublicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const versionSegment =
    typeof version === "number" && Number.isInteger(version) && version > 0
      ? `/v${version}`
      : "";

  return `https://res.cloudinary.com/${encodedCloudName}/image/upload/${CLOUDINARY_TRANSFORMATIONS[preset]}${versionSegment}/${encodedPublicId}`;
};

/** Returns whether a stored original URL is compatible with Next Image. */
const isCloudinaryOriginalUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
};

/**
 * Resolves an object-based Cloudinary image first, then a legacy raw URL.
 *
 * @param input - Future image reference, legacy URL, accessible fallback alt, and preset
 * @returns A renderable image source, or null when no real image is available
 */
export const resolveAppImage = ({
  image,
  imageUrl,
  fallbackAlt,
  preset,
}: ResolveAppImageInput): ResolvedAppImage | null => {
  if (image?.source === "cloudinary") {
    const normalizedPublicId = normalizeCloudinaryPublicId(image.publicId);
    const normalizedAlt = image.alt.trim() || fallbackAlt;

    if (normalizedPublicId) {
      const cloudinaryUrl = buildCloudinaryUrl(
        normalizedPublicId,
        preset,
        image.version,
      );
      if (cloudinaryUrl) {
        return { url: cloudinaryUrl, alt: normalizedAlt };
      }
    }

    const normalizedOriginalUrl = image.originalUrl?.trim();
    if (
      normalizedOriginalUrl &&
      isCloudinaryOriginalUrl(normalizedOriginalUrl)
    ) {
      return { url: normalizedOriginalUrl, alt: normalizedAlt };
    }
  }

  const normalizedLegacyUrl = imageUrl?.trim();
  if (!normalizedLegacyUrl) return null;

  return { url: normalizedLegacyUrl, alt: fallbackAlt };
};
