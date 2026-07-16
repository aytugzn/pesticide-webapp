import "server-only";

import type { Firestore } from "firebase-admin/firestore";
import type { ActionResponse } from "@/types";
import { REVIEWS_DRAFT_DOCUMENT_ID } from "./constants";
import { saveReviewsDraftSchema } from "./schemas";
import {
  REVIEW_ERRORS,
  type PublishReviewsResult,
  type ReviewErrorCode,
  type ReviewItem,
} from "./types";
import { parseReviewItems, serializeReviewItems } from "./utils";

export type PreparedReviewsPublish = {
  draft: { items: ReviewItem[]; viewAllUrl?: string } | null;
  shouldPublish: boolean;
};

/**
 * Reads and validates review draft state without mutating Firestore.
 *
 * @param db - Authorized Admin Firestore instance
 * @returns Valid draft data and whether public review content differs
 */
export const prepareReviewsDraftPublish = async (
  db: Firestore,
): Promise<ActionResponse<PreparedReviewsPublish, ReviewErrorCode>> => {
  try {
    const settings = db.collection("settings");
    const [draftSnap, publishedSnap] = await Promise.all([
      settings.doc(REVIEWS_DRAFT_DOCUMENT_ID).get(),
      settings.doc("reviews").get(),
    ]);
    if (!draftSnap.exists) {
      return {
        success: true,
        data: { draft: null, shouldPublish: false },
      };
    }

    const draftData = draftSnap.data();
    const parsedDraft = saveReviewsDraftSchema.safeParse({
      items: draftData?.items,
      viewAllUrl: draftData?.viewAllUrl ?? "",
    });
    if (!parsedDraft.success) {
      return { success: false, error: REVIEW_ERRORS.VALIDATION_FAILED };
    }

    const publishedData = publishedSnap.data();
    const publishedItems = parseReviewItems(publishedData?.items);
    const publishedViewAllUrl =
      typeof publishedData?.viewAllUrl === "string"
        ? publishedData.viewAllUrl.trim()
        : undefined;
    const draft = parsedDraft.data;
    const shouldPublish =
      JSON.stringify(serializeReviewItems(draft.items)) !==
        JSON.stringify(serializeReviewItems(publishedItems)) ||
      draft.viewAllUrl !== publishedViewAllUrl;

    return { success: true, data: { draft, shouldPublish } };
  } catch {
    console.error("Failed to prepare reviews publish");
    return { success: false, error: REVIEW_ERRORS.FETCH_FAILED };
  }
};

/**
 * Atomically copies a validated review draft to the published document and
 * removes the consumed draft. A matching draft is only removed as cleanup.
 *
 * @param db - Authorized Admin Firestore instance
 * @param prepared - Validated review publication state
 * @returns Whether public review content changed
 */
export const commitReviewsPublish = async (
  db: Firestore,
  prepared: PreparedReviewsPublish,
): Promise<ActionResponse<PublishReviewsResult, ReviewErrorCode>> => {
  if (!prepared.draft) {
    return { success: true, data: { published: false } };
  }

  try {
    const settings = db.collection("settings");
    const batch = db.batch();
    if (prepared.shouldPublish) {
      batch.set(settings.doc("reviews"), {
        items: serializeReviewItems(prepared.draft.items),
        ...(prepared.draft.viewAllUrl
          ? { viewAllUrl: prepared.draft.viewAllUrl }
          : {}),
      });
    }
    batch.delete(settings.doc(REVIEWS_DRAFT_DOCUMENT_ID));
    await batch.commit();
    return {
      success: true,
      data: { published: prepared.shouldPublish },
    };
  } catch {
    console.error("Failed to publish reviews");
    return { success: false, error: REVIEW_ERRORS.FETCH_FAILED };
  }
};
