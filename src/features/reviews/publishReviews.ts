import "server-only";

import type { Firestore } from "firebase-admin/firestore";
import {
  finalizePreparedDraft,
  getPreparedDraftVersionStatus,
  getFirestoreDocumentVersion,
  type DraftFinalizationStatus,
  type FirestoreDocumentVersion,
} from "@/lib/firestoreDraftFinalization";
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
  hasDraft: boolean;
  draftVersion: FirestoreDocumentVersion | null;
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
        data: {
          hasDraft: false,
          draftVersion: null,
          draft: null,
          shouldPublish: false,
        },
      };
    }

    const draftData = draftSnap.data();
    const draftVersion = getFirestoreDocumentVersion(draftSnap);
    if (!draftVersion) {
      console.error("Failed to read reviews draft version");
      return { success: false, error: REVIEW_ERRORS.FETCH_FAILED };
    }
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

    return {
      success: true,
      data: { hasDraft: true, draftVersion, draft, shouldPublish },
    };
  } catch {
    console.error("Failed to prepare reviews publish");
    return { success: false, error: REVIEW_ERRORS.FETCH_FAILED };
  }
};

/**
 * Atomically copies a validated review draft to the published document and
 * leaves the draft in place until snapshot and cache activation succeeds.
 *
 * @param db - Authorized Admin Firestore instance
 * @param prepared - Validated review publication state
 * @returns Whether public review content changed
 */
export const commitReviewsPublish = async (
  db: Firestore,
  prepared: PreparedReviewsPublish,
): Promise<ActionResponse<PublishReviewsResult, ReviewErrorCode>> => {
  try {
    const settings = db.collection("settings");
    const result = await db.runTransaction<PublishReviewsResult | null>(
      async (transaction) => {
        if (prepared.hasDraft) {
          const draftRef = settings.doc(REVIEWS_DRAFT_DOCUMENT_ID);
          const currentDraft = await transaction.get(draftRef);
          const versionStatus = getPreparedDraftVersionStatus(
            currentDraft,
            prepared.draftVersion,
          );
          if (versionStatus === "failed") return null;
          if (versionStatus !== "current") {
            return { published: false, status: versionStatus };
          }
        }

        if (!prepared.draft || !prepared.shouldPublish) {
          return { published: false, status: "unchanged-current" };
        }

        transaction.set(settings.doc("reviews"), {
          items: serializeReviewItems(prepared.draft.items),
          ...(prepared.draft.viewAllUrl
            ? { viewAllUrl: prepared.draft.viewAllUrl }
            : {}),
        });
        return { published: true, status: "published" };
      },
    );
    if (!result) {
      console.error("Failed to verify reviews draft version");
      return { success: false, error: REVIEW_ERRORS.FETCH_FAILED };
    }
    return { success: true, data: result };
  } catch {
    console.error("Failed to publish reviews");
    return { success: false, error: REVIEW_ERRORS.FETCH_FAILED };
  }
};

/**
 * Removes a consumed reviews draft after public activation succeeds.
 *
 * @param db - Authorized Admin Firestore instance
 * @returns Whether pending activation state was cleared
 */
export const finalizeReviewsPublish = async (
  db: Firestore,
  expectedVersion: FirestoreDocumentVersion | null,
): Promise<DraftFinalizationStatus> =>
  finalizePreparedDraft(
    db,
    db.collection("settings").doc(REVIEWS_DRAFT_DOCUMENT_ID),
    expectedVersion,
  );
