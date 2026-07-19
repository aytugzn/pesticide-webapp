import "server-only";

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  finalizePreparedDraft,
  getPreparedDraftVersionStatus,
  getFirestoreDocumentVersion,
  type DraftFinalizationStatus,
  type FirestoreDocumentVersion,
} from "@/lib/firestoreDraftFinalization";
import type { ActionResponse } from "@/types";
import { parseSettingsDoc } from "@/utils/parsers";
import { GENERAL_SETTINGS_DRAFT_DOCUMENT_ID } from "./constants";
import { generalSettingsDraftSchema } from "./schemas";
import {
  SETTINGS_ERRORS,
  type GeneralSettingsDraftData,
  type PublishGeneralSettingsResult,
  type SettingsErrorCode,
} from "./types";

export type PreparedGeneralSettingsPublish = {
  hasDraft: boolean;
  draftVersion: FirestoreDocumentVersion | null;
  draft: GeneralSettingsDraftData | null;
  draftHasChanges: boolean;
  shouldPublish: boolean;
  shouldCleanPublishedGoogleStats: boolean;
};

/** Compares only the allowlisted public fields owned by general settings. */
const hasGeneralSettingsChanges = (
  draft: GeneralSettingsDraftData,
  published: ReturnType<typeof parseSettingsDoc>,
): boolean => {
  const next = parseSettingsDoc(draft);
  return (
    next.phone !== published.phone ||
    next.email !== published.email ||
    next.address !== published.address ||
    next.workingHours !== published.workingHours ||
    next.instagramUrl !== published.instagramUrl ||
    next.facebookUrl !== published.facebookUrl ||
    (draft.googlePlaceId !== undefined &&
      (next.googlePlaceId ?? "") !== (published.googlePlaceId ?? "")) ||
    next.heroAutoplayDelay !== published.heroAutoplayDelay ||
    next.servicesAutoplayDelay !== published.servicesAutoplayDelay ||
    next.whyUsAutoplayDelay !== published.whyUsAutoplayDelay ||
    next.reviewsAutoplayDelay !== published.reviewsAutoplayDelay
  );
};

/**
 * Detects only the legacy Google fields previously written by this project.
 *
 * @param data - Raw published general settings data
 * @returns Whether either legacy Google stats field is present
 */
const hasLegacyGoogleStats = (
  data: Record<string, unknown> | undefined,
): boolean =>
  Boolean(
    data &&
      (Object.prototype.hasOwnProperty.call(data, "googleStats") ||
        Object.prototype.hasOwnProperty.call(
          data,
          "googleProfileLastCheckedAt",
        )),
  );

/**
 * Reads and validates the general settings draft without writing Firestore.
 * Legacy Google stats are detected for cleanup without parsing them publicly.
 *
 * @param db - Admin Firestore instance obtained after authorization
 * @returns Validated draft and legacy cleanup state
 */
export const prepareGeneralSettingsDraftPublish = async (
  db: Firestore,
): Promise<
  ActionResponse<PreparedGeneralSettingsPublish, SettingsErrorCode>
> => {
  try {
    const settingsCollection = db.collection("settings");
    const [publishedSnap, draftSnap] = await Promise.all([
      settingsCollection.doc("general").get(),
      settingsCollection.doc(GENERAL_SETTINGS_DRAFT_DOCUMENT_ID).get(),
    ]);
    const publishedData = publishedSnap.data();
    const shouldCleanPublishedGoogleStats =
      hasLegacyGoogleStats(publishedData);

    if (!draftSnap.exists) {
      return {
        success: true,
        data: {
          hasDraft: false,
          draftVersion: null,
          draft: null,
          draftHasChanges: false,
          shouldPublish: shouldCleanPublishedGoogleStats,
          shouldCleanPublishedGoogleStats,
        },
      };
    }

    const rawDraft = draftSnap.data();
    const draftVersion = getFirestoreDocumentVersion(draftSnap);
    if (!draftVersion) {
      console.error("Failed to read general settings draft version");
      return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
    }
    const parsedDraft = generalSettingsDraftSchema.safeParse(rawDraft);
    if (!parsedDraft.success) {
      return { success: false, error: SETTINGS_ERRORS.VALIDATION_FAILED };
    }

    const draftHasChanges = hasGeneralSettingsChanges(
      parsedDraft.data,
      parseSettingsDoc(publishedData),
    );
    return {
      success: true,
      data: {
        hasDraft: true,
        draftVersion,
        draft: parsedDraft.data,
        draftHasChanges,
        shouldPublish:
          draftHasChanges || shouldCleanPublishedGoogleStats,
        shouldCleanPublishedGoogleStats,
      },
    };
  } catch {
    console.error("Failed to prepare general settings publish");
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }
};

/**
 * Removes a consumed general-settings draft after public activation succeeds.
 *
 * @param db - Authorized Admin Firestore instance
 * @returns Whether pending activation state was cleared
 */
export const finalizeGeneralSettingsPublish = async (
  db: Firestore,
  expectedVersion: FirestoreDocumentVersion | null,
): Promise<DraftFinalizationStatus> =>
  finalizePreparedDraft(
    db,
    db.collection("settings").doc(GENERAL_SETTINGS_DRAFT_DOCUMENT_ID),
    expectedVersion,
  );

/**
 * Commits allowlisted general settings and removes legacy Google stats.
 * Site-image fields remain untouched through a merge-only write.
 *
 * @param db - Admin Firestore instance obtained after authorization
 * @param prepared - Validated general settings publish state
 * @returns Whether the general settings domain wrote published data
 */
export const commitGeneralSettingsPublish = async (
  db: Firestore,
  prepared: PreparedGeneralSettingsPublish,
): Promise<
  ActionResponse<PublishGeneralSettingsResult, SettingsErrorCode>
> => {
  try {
    const settingsCollection = db.collection("settings");
    const publishedData: Record<string, unknown> = {
      googleStats: FieldValue.delete(),
      googleProfileLastCheckedAt: FieldValue.delete(),
    };
    if (prepared.draft && prepared.draftHasChanges) {
      const draft = prepared.draft;
      Object.assign(publishedData, {
        phone: draft.phone,
        email: draft.email,
        address: draft.address,
        workingHours: draft.workingHours,
        instagramUrl: draft.instagramUrl,
        facebookUrl: draft.facebookUrl,
        heroAutoplayDelay: draft.heroAutoplayDelay,
        servicesAutoplayDelay: draft.servicesAutoplayDelay,
        whyUsAutoplayDelay: draft.whyUsAutoplayDelay,
        reviewsAutoplayDelay: draft.reviewsAutoplayDelay,
      });

      if (draft.googlePlaceId !== undefined) {
        publishedData.googlePlaceId =
          draft.googlePlaceId || FieldValue.delete();
      }
    }

    const result = await db.runTransaction<
      PublishGeneralSettingsResult | null
    >(async (transaction) => {
      if (prepared.hasDraft) {
        const draftRef = settingsCollection.doc(
          GENERAL_SETTINGS_DRAFT_DOCUMENT_ID,
        );
        const currentDraft = await transaction.get(draftRef);
        const versionStatus = getPreparedDraftVersionStatus(
          currentDraft,
          prepared.draftVersion,
        );
        if (versionStatus === "failed") return null;
        if (versionStatus !== "current") {
          return {
            published: false,
            status: versionStatus,
          };
        }
      }

      if (!prepared.shouldPublish) {
        return { published: false, status: "unchanged-current" };
      }

      transaction.set(
        settingsCollection.doc("general"),
        publishedData,
        { merge: true },
      );
      return { published: true, status: "published" };
    });
    if (!result) {
      console.error("Failed to verify general settings draft version");
      return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
    }
    return { success: true, data: result };
  } catch {
    console.error("Failed to publish general settings");
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }
};
