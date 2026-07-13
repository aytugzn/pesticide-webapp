import "server-only";

import { createHash } from "node:crypto";
import { cloudinaryDestroyResponseSchema } from "@/features/image-upload/schemas";
import { normalizeCloudinaryPublicId } from "@/utils/cloudinary";

const MANAGED_SITE_IMAGE_FOLDERS = [
  "sites/default/home/hero/",
  "sites/default/shared/why-us/",
  "sites/default/home/services/",
] as const;

/**
 * Checks whether a public ID belongs to one of the admin-managed site image folders.
 *
 * @param publicId - Normalized Cloudinary public ID
 * @returns Whether the asset is within the site-image cleanup boundary
 */
const isManagedSiteImagePublicId = (publicId: string): boolean =>
  MANAGED_SITE_IMAGE_FOLDERS.some((folder) => publicId.startsWith(folder));

/**
 * Extracts a public ID from a legacy delivery URL only when it belongs to the
 * configured Cloudinary cloud and an admin-managed site image folder.
 *
 * @param value - Potential legacy Cloudinary delivery URL
 * @returns A safe managed public ID, or null when the URL is not eligible
 */
const parseManagedPublicIdFromUrl = (value: string): string | null => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
      return null;
    }

    const segments = url.pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));

    if (
      segments[0] !== cloudName ||
      segments[1] !== "image" ||
      segments[2] !== "upload"
    ) {
      return null;
    }

    const deliverySegments = segments.slice(3);
    const versionIndex = deliverySegments.findIndex((segment) =>
      /^v\d+$/.test(segment),
    );
    const publicIdSegments =
      versionIndex >= 0
        ? deliverySegments.slice(versionIndex + 1)
        : deliverySegments;

    if (publicIdSegments.length === 0) return null;

    const lastIndex = publicIdSegments.length - 1;
    publicIdSegments[lastIndex] = publicIdSegments[lastIndex].replace(
      /\.[a-z0-9]{2,5}$/i,
      "",
    );

    const publicId = normalizeCloudinaryPublicId(publicIdSegments.join("/"));
    return publicId && isManagedSiteImagePublicId(publicId) ? publicId : null;
  } catch {
    return null;
  }
};

/**
 * Recursively collects managed Cloudinary public IDs from raw Firestore data.
 * Object-based AppImage references are preferred, while safe same-cloud legacy
 * URLs remain supported without requiring a migration.
 *
 * @param data - Raw settings document data
 * @returns Unique public IDs within the managed site-image folders
 */
export const collectManagedSiteImagePublicIds = (
  data: unknown,
): Set<string> => {
  const publicIds = new Set<string>();
  const visit = (value: unknown): void => {
    if (typeof value === "string") {
      const publicId = parseManagedPublicIdFromUrl(value);
      if (publicId) publicIds.add(publicId);
      return;
    }

    if (!value || typeof value !== "object") return;

    if (!Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      if (record.source === "cloudinary" && typeof record.publicId === "string") {
        const publicId = normalizeCloudinaryPublicId(record.publicId);
        if (publicId && isManagedSiteImagePublicId(publicId)) {
          publicIds.add(publicId);
        }
      }
    }

    Object.values(value).forEach(visit);
  };

  visit(data);
  return publicIds;
};

/**
 * Deletes one managed site image through Cloudinary's authenticated server API.
 * Missing assets are treated as already cleaned up.
 *
 * @param publicId - Managed Cloudinary public ID selected after reference checks
 * @returns Whether the asset is absent from Cloudinary after the request
 */
export const deleteManagedSiteImage = async (
  publicId: string,
): Promise<boolean> => {
  const normalizedPublicId = normalizeCloudinaryPublicId(publicId);
  if (!normalizedPublicId || !isManagedSiteImagePublicId(normalizedPublicId)) {
    console.warn("Skipped unmanaged Cloudinary site image cleanup");
    return false;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary cleanup configuration missing");
    return false;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`public_id=${normalizedPublicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  const body = new FormData();
  body.set("public_id", normalizedPublicId);
  body.set("timestamp", String(timestamp));
  body.set("api_key", apiKey);
  body.set("signature", signature);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`,
      { method: "POST", body, cache: "no-store" },
    );

    if (!response.ok) {
      console.error("Cloudinary site image cleanup failed", {
        status: response.status,
      });
      return false;
    }

    const result = cloudinaryDestroyResponseSchema.safeParse(
      await response.json(),
    );
    if (!result.success) {
      console.error("Cloudinary cleanup response validation failed");
      return false;
    }

    return true;
  } catch {
    console.error("Cloudinary site image cleanup request failed");
    return false;
  }
};
