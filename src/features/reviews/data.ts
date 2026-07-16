import "server-only";

import { requireAdmin } from "@/features/auth/requireAdmin";
import { getAdminDb } from "@/lib/firebase-admin";
import { REVIEWS_DRAFT_DOCUMENT_ID } from "./constants";
import type { AdminReviewsData } from "./types";
import { parseReviewItems } from "./utils";

/**
 * Loads the isolated review draft for admins, falling back to published data.
 *
 * @returns Editable review data, or null when authorization or loading fails
 */
export const getAdminReviewsData = async (): Promise<AdminReviewsData | null> => {
  if (!(await requireAdmin())) return null;

  try {
    const settings = getAdminDb().collection("settings");
    const [draftSnap, publishedSnap] = await Promise.all([
      settings.doc(REVIEWS_DRAFT_DOCUMENT_ID).get(),
      settings.doc("reviews").get(),
    ]);
    const source = draftSnap.exists ? draftSnap.data() : publishedSnap.data();
    const rawViewAllUrl = source?.viewAllUrl;

    return {
      items: parseReviewItems(source?.items),
      ...(typeof rawViewAllUrl === "string" && rawViewAllUrl.trim()
        ? { viewAllUrl: rawViewAllUrl.trim() }
        : {}),
    };
  } catch {
    console.error("Failed to load admin review data");
    return null;
  }
};
