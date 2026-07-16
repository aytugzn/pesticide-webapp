import type { ActionResponse, AppImage } from "@/types";
import type {
  AdminImageCleanupResult,
  AdminImageCleanupStatus,
  ImageUploadErrorCode,
} from "./types";

type AdminImageCleanupAction = (input: {
  publicIds: string[];
}) => Promise<ActionResponse<AdminImageCleanupResult, ImageUploadErrorCode>>;

/**
 * Requests best-effort rollback for assets uploaded during one client attempt.
 * Cleanup action failures are converted to a warning-safe partial status.
 *
 * @param uploadedImages - New AppImage references from the current attempt only
 * @param cleanupAction - Admin-protected server cleanup action
 * @returns Cleanup status suitable for preserving the primary save error
 */
export const rollbackUploadedAdminImages = async (
  uploadedImages: readonly AppImage[],
  cleanupAction: AdminImageCleanupAction,
): Promise<AdminImageCleanupStatus> => {
  if (uploadedImages.length === 0) return "not-needed";

  try {
    const result = await cleanupAction({
      publicIds: uploadedImages.map((image) => image.publicId),
    });

    if (!result.success || !result.data) return "partial-failure";
    return result.data.status;
  } catch {
    return "partial-failure";
  }
};
