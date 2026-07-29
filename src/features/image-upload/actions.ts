"use server";

import "server-only";

import { createHash } from "node:crypto";
import { requireAdminMutation } from "@/features/auth/requireAdminMutation";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ActionResponse, AppImage } from "@/types";
import {
  adminImageCleanupInputSchema,
  cloudinaryUploadResponseSchema,
  imageUploadInputSchema,
} from "./schemas";
import {
  IMAGE_UPLOAD_ERRORS,
  type AdminImageCleanupResult,
  type ImageUploadErrorCode,
} from "./types";
import {
  collectManagedAdminImagePublicIds,
  deleteManagedAdminImage,
  isManagedAdminImagePublicId,
} from "./cloudinary";
import { normalizeCloudinaryPublicId } from "@/utils/cloudinary";
import { assertCloudinaryCloudConsistency } from "@/lib/environmentConsistency";
import {
  fetchWithTimeout,
  isProviderTimeoutError,
} from "@/lib/serverRequest";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const CLOUDINARY_UPLOAD_TIMEOUT_MS = 30_000;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Confirms that the uploaded bytes match the declared supported image MIME type.
 *
 * @param file - Admin-selected image file
 * @returns Whether the file header matches JPEG, PNG, or WebP
 */
const hasValidImageSignature = async (file: File): Promise<boolean> => {
  try {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());

    if (file.type === "image/jpeg") {
      return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    }

    if (file.type === "image/png") {
      const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      return pngSignature.every((byte, index) => header[index] === byte);
    }

    return (
      file.type === "image/webp" &&
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46 &&
      header[8] === 0x57 &&
      header[9] === 0x45 &&
      header[10] === 0x42 &&
      header[11] === 0x50
    );
  } catch {
    return false;
  }
};

/**
 * Resolves the destination Cloudinary folder for an upload target.
 */
const CLOUDINARY_ASSET_ROOT = "sites/default";

const resolveUploadFolder = (target: string, slug?: string): string => {
  switch (target) {
    case "pest":
      return `${CLOUDINARY_ASSET_ROOT}/entities/pests/${slug}`;
    case "region":
      return `${CLOUDINARY_ASSET_ROOT}/entities/regions/${slug}`;
    case "site-hero":
      return `${CLOUDINARY_ASSET_ROOT}/home/hero`;
    case "site-why-us":
      return `${CLOUDINARY_ASSET_ROOT}/shared/why-us`;
    case "site-services":
    default:
      return `${CLOUDINARY_ASSET_ROOT}/home/services`;
  }
};

/**
 * Uploads one validated admin-selected image to the entity's Cloudinary folder.
 * The Cloudinary secret remains server-only and the action does not invalidate caches.
 *
 * @param formData - Image file, entity type, entity slug, and accessible alt text
 * @returns An AppImage reference or a safe upload error code
 */
export const uploadAdminImage = async (
  formData: FormData,
): Promise<ActionResponse<AppImage, ImageUploadErrorCode>> => {
  const guardFailure = await requireAdminMutation(
    "cloudinary-upload",
    IMAGE_UPLOAD_ERRORS.UNAUTHORIZED,
  );
  if (guardFailure) {
    return guardFailure;
  }

  const parsedInput = imageUploadInputSchema.safeParse({
    target: formData.get("target"),
    slug: formData.get("slug"),
    alt: formData.get("alt"),
  });

  if (!parsedInput.success) {
    return { success: false, error: IMAGE_UPLOAD_ERRORS.VALIDATION_FAILED };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: IMAGE_UPLOAD_ERRORS.FILE_REQUIRED };
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { success: false, error: IMAGE_UPLOAD_ERRORS.INVALID_FILE_TYPE };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { success: false, error: IMAGE_UPLOAD_ERRORS.FILE_TOO_LARGE };
  }

  if (!(await hasValidImageSignature(file))) {
    return { success: false, error: IMAGE_UPLOAD_ERRORS.INVALID_FILE_TYPE };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary upload configuration missing");
    return {
      success: false,
      error: IMAGE_UPLOAD_ERRORS.CONFIGURATION_FAILED,
    };
  }

  try {
    assertCloudinaryCloudConsistency();
  } catch {
    console.error("Cloudinary client/server configuration mismatch");
    return {
      success: false,
      error: IMAGE_UPLOAD_ERRORS.CONFIGURATION_FAILED,
    };
  }

  const { target, alt } = parsedInput.data;
  const slug = "slug" in parsedInput.data ? parsedInput.data.slug : undefined;
  const folder = resolveUploadFolder(target, slug);
  const transformation = "c_limit,h_2048,w_2048";
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}&transformation=${transformation}${apiSecret}`)
    .digest("hex");
  const uploadData = new FormData();
  uploadData.set("file", file);
  uploadData.set("api_key", apiKey);
  uploadData.set("timestamp", String(timestamp));
  uploadData.set("folder", folder);
  uploadData.set("transformation", transformation);
  uploadData.set("signature", signature);

  try {
    const response = await fetchWithTimeout(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      {
        method: "POST",
        body: uploadData,
        cache: "no-store",
      },
      CLOUDINARY_UPLOAD_TIMEOUT_MS,
      "cloudinary",
    );

    if (!response.ok) {
      console.error("Cloudinary upload failed", { status: response.status });
      return { success: false, error: IMAGE_UPLOAD_ERRORS.UPLOAD_FAILED };
    }

    const parsedResponse = cloudinaryUploadResponseSchema.safeParse(
      await response.json(),
    );

    if (!parsedResponse.success) {
      console.error("Cloudinary upload response validation failed");
      return { success: false, error: IMAGE_UPLOAD_ERRORS.UPLOAD_FAILED };
    }

    const uploaded = parsedResponse.data;

    return {
      success: true,
      data: {
        source: "cloudinary",
        publicId: uploaded.public_id,
        alt,
        originalUrl: uploaded.secure_url,
        ...(uploaded.asset_id ? { assetId: uploaded.asset_id } : {}),
        ...(uploaded.version ? { version: uploaded.version } : {}),
        ...(uploaded.width ? { width: uploaded.width } : {}),
        ...(uploaded.height ? { height: uploaded.height } : {}),
        ...(uploaded.format ? { format: uploaded.format } : {}),
      },
    };
  } catch (error: unknown) {
    if (isProviderTimeoutError(error)) {
      console.error("Cloudinary upload request timed out");
      return { success: false, error: IMAGE_UPLOAD_ERRORS.UPLOAD_FAILED };
    }
    console.error("Cloudinary upload request failed");
    return { success: false, error: IMAGE_UPLOAD_ERRORS.UPLOAD_FAILED };
  }
};

/**
 * Best-effort rollback for newly uploaded images after a failed Firestore save.
 * Existing Firestore references are rechecked before any Cloudinary deletion.
 *
 * @param input - Candidate public IDs returned by the current upload attempt
 * @returns A not-needed, success, or partial-failure cleanup status
 */
export const cleanupAdminImageUploads = async (
  input: unknown,
): Promise<ActionResponse<AdminImageCleanupResult, ImageUploadErrorCode>> => {
  const guardFailure = await requireAdminMutation(
    "cloudinary-cleanup",
    IMAGE_UPLOAD_ERRORS.UNAUTHORIZED,
  );
  if (guardFailure) {
    return guardFailure;
  }

  const parsedInput = adminImageCleanupInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: IMAGE_UPLOAD_ERRORS.VALIDATION_FAILED };
  }

  if (parsedInput.data.publicIds.length === 0) {
    return { success: true, data: { status: "not-needed" } };
  }

  const normalizedPublicIds = new Set<string>();
  let hasRejectedCandidate = false;
  parsedInput.data.publicIds.forEach((publicId) => {
    const normalizedPublicId = normalizeCloudinaryPublicId(publicId);
    if (
      normalizedPublicId &&
      isManagedAdminImagePublicId(normalizedPublicId)
    ) {
      normalizedPublicIds.add(normalizedPublicId);
      return;
    }

    hasRejectedCandidate = true;
  });

  if (normalizedPublicIds.size === 0) {
    return { success: true, data: { status: "partial-failure" } };
  }

  try {
    const db = getAdminDb();
    const [settingsSnapshot, pestsSnapshot, regionsSnapshot] =
      await Promise.all([
        db.collection("settings").get(),
        db.collection("pests").get(),
        db.collection("regions").get(),
      ]);
    const referencedPublicIds = new Set<string>();
    [settingsSnapshot, pestsSnapshot, regionsSnapshot].forEach((snapshot) => {
      snapshot.docs.forEach((doc) => {
        collectManagedAdminImagePublicIds(doc.data()).forEach((publicId) =>
          referencedPublicIds.add(publicId),
        );
      });
    });

    const deletionCandidates = [...normalizedPublicIds].filter(
      (publicId) => !referencedPublicIds.has(publicId),
    );
    const hasReferencedCandidate =
      deletionCandidates.length !== normalizedPublicIds.size;
    const deletionResults = await Promise.allSettled(
      deletionCandidates.map(deleteManagedAdminImage),
    );
    const hasDeletionFailure = deletionResults.some(
      (result) => result.status === "rejected" || !result.value,
    );

    return {
      success: true,
      data: {
        status:
          hasRejectedCandidate ||
          hasReferencedCandidate ||
          hasDeletionFailure
            ? "partial-failure"
            : "success",
      },
    };
  } catch {
    console.error("Failed to verify admin image rollback references");
    return { success: true, data: { status: "partial-failure" } };
  }
};
