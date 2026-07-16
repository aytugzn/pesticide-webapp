import "server-only";

import { createHash } from "node:crypto";
import { cloudinaryDestroyResponseSchema } from "@/features/image-upload/schemas";
import { normalizeCloudinaryPublicId } from "@/utils/cloudinary";

const MANAGED_SITE_IMAGE_FOLDERS = [
  "sites/default/home/hero/",
  "sites/default/shared/why-us/",
  "sites/default/home/services/",
] as const;

const MANAGED_ADMIN_IMAGE_FOLDERS = [
  ...MANAGED_SITE_IMAGE_FOLDERS,
  "sites/default/entities/pests/",
  "sites/default/entities/regions/",
] as const;

type ManagedPublicIdPredicate = (publicId: string) => boolean;

/**
 * Rejects empty, traversal-like, and backslash-separated Cloudinary paths.
 *
 * @param publicId - Normalized Cloudinary public ID
 * @returns Whether every folder segment is safe to evaluate against allowlists
 */
const hasSafePublicIdSegments = (publicId: string): boolean =>
  !publicId.includes("\\") &&
  publicId
    .split("/")
    .every((segment) => segment.length > 0 && segment !== "." && segment !== "..");

/**
 * Checks whether a public ID belongs to one of the admin-managed site image folders.
 *
 * @param publicId - Normalized Cloudinary public ID
 * @returns Whether the asset is within the site-image cleanup boundary
 */
const isManagedSiteImagePublicId = (publicId: string): boolean =>
  hasSafePublicIdSegments(publicId) &&
  MANAGED_SITE_IMAGE_FOLDERS.some((folder) => publicId.startsWith(folder));

/**
 * Checks whether a public ID belongs to any admin-managed upload folder.
 *
 * @param publicId - Normalized Cloudinary public ID
 * @returns Whether rollback may consider the asset for deletion
 */
export const isManagedAdminImagePublicId = (publicId: string): boolean =>
  hasSafePublicIdSegments(publicId) &&
  MANAGED_ADMIN_IMAGE_FOLDERS.some((folder) => publicId.startsWith(folder));

/**
 * Extracts a public ID from a legacy delivery URL only when it belongs to the
 * configured Cloudinary cloud and an admin-managed site image folder.
 *
 * @param value - Potential legacy Cloudinary delivery URL
 * @returns A safe managed public ID, or null when the URL is not eligible
 */
const parseManagedPublicIdFromUrl = (
  value: string,
  isManagedPublicId: ManagedPublicIdPredicate,
): string | null => {
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
    return publicId && isManagedPublicId(publicId) ? publicId : null;
  } catch {
    return null;
  }
};

/**
 * Recursively collects allowlisted Cloudinary public IDs from Firestore data.
 * Object references and safe same-cloud legacy URLs are both supported.
 *
 * @param data - Raw Firestore document data
 * @param isManagedPublicId - Scope-specific public ID allowlist predicate
 * @returns Unique public IDs accepted by the supplied predicate
 */
const collectManagedImagePublicIds = (
  data: unknown,
  isManagedPublicId: ManagedPublicIdPredicate,
): Set<string> => {
  const publicIds = new Set<string>();
  const visit = (value: unknown): void => {
    if (typeof value === "string") {
      const publicId = parseManagedPublicIdFromUrl(value, isManagedPublicId);
      if (publicId) publicIds.add(publicId);
      return;
    }

    if (!value || typeof value !== "object") return;

    if (!Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      if (record.source === "cloudinary" && typeof record.publicId === "string") {
        const publicId = normalizeCloudinaryPublicId(record.publicId);
        if (publicId && isManagedPublicId(publicId)) {
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
 * Collects managed site-image references without widening stale publish cleanup.
 *
 * @param data - Raw Firestore document data
 * @returns Unique public IDs within site-only managed folders
 */
export const collectManagedSiteImagePublicIds = (
  data: unknown,
): Set<string> => collectManagedImagePublicIds(data, isManagedSiteImagePublicId);

/**
 * Collects all admin-managed image references for rollback safety checks.
 *
 * @param data - Raw Firestore document data
 * @returns Unique public IDs within site and entity managed folders
 */
export const collectManagedAdminImagePublicIds = (
  data: unknown,
): Set<string> => collectManagedImagePublicIds(data, isManagedAdminImagePublicId);

/**
 * Deletes one already-normalized and allowlisted Cloudinary image.
 *
 * @param normalizedPublicId - Safe public ID selected by a scoped wrapper
 * @returns Whether the asset is absent after the request
 */
const deleteManagedImage = async (
  normalizedPublicId: string,
): Promise<boolean> => {
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
      console.error("Cloudinary managed image cleanup failed", {
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
    console.error("Cloudinary managed image cleanup request failed");
    return false;
  }
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

  return deleteManagedImage(normalizedPublicId);
};

/**
 * Deletes one image within the broader admin rollback allowlist.
 *
 * @param publicId - Candidate public ID from a failed client save attempt
 * @returns Whether the asset is absent from Cloudinary after the request
 */
export const deleteManagedAdminImage = async (
  publicId: string,
): Promise<boolean> => {
  const normalizedPublicId = normalizeCloudinaryPublicId(publicId);
  if (!normalizedPublicId || !isManagedAdminImagePublicId(normalizedPublicId)) {
    console.warn("Skipped unmanaged Cloudinary admin image cleanup");
    return false;
  }

  return deleteManagedImage(normalizedPublicId);
};
