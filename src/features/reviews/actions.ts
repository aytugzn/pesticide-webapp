"use server";

import "server-only";

import type { ActionResponse } from "@/types";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { getAdminDb } from "@/lib/firebase-admin";
import { REVIEWS_DRAFT_DOCUMENT_ID } from "./constants";
import { saveReviewsDraftSchema } from "./schemas";
import {
  REVIEW_ERRORS,
  type ReviewErrorCode,
  type SaveReviewsDraftInput,
} from "./types";
import { serializeReviewItems } from "./utils";

/**
 * Saves ordered reviews only to the isolated draft document.
 * Public review data and its cache remain untouched until global publish.
 *
 * @param input - Ordered review items and preserved public source URL
 * @returns A controlled draft-save response
 */
export const saveReviewsDraft = async (
  input: SaveReviewsDraftInput,
): Promise<ActionResponse<void, ReviewErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: REVIEW_ERRORS.UNAUTHORIZED };
  }

  const parsed = saveReviewsDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: REVIEW_ERRORS.VALIDATION_FAILED };
  }

  try {
    await getAdminDb()
      .collection("settings")
      .doc(REVIEWS_DRAFT_DOCUMENT_ID)
      .set({
        items: serializeReviewItems(parsed.data.items),
        ...(parsed.data.viewAllUrl
          ? { viewAllUrl: parsed.data.viewAllUrl }
          : {}),
        updatedAt: Date.now(),
      });
    return { success: true };
  } catch {
    console.error("Failed to save reviews draft");
    return { success: false, error: REVIEW_ERRORS.SAVE_FAILED };
  }
};
