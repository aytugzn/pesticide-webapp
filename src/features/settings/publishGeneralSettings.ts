import "server-only";

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { ActionResponse } from "@/types";
import { GENERAL_SETTINGS_DRAFT_DOCUMENT_ID } from "./constants";
import { generalSettingsDraftSchema } from "./schemas";
import {
  SETTINGS_ERRORS,
  type GeneralSettingsDraftData,
  type PublishGeneralSettingsResult,
  type SettingsErrorCode,
} from "./types";

export type PreparedGeneralSettingsPublish = {
  draft: GeneralSettingsDraftData | null;
  shouldCleanPublishedGoogleStats: boolean;
};

/**
 * Detects only the legacy Google fields previously written by this project.
 *
 * @param data - Raw published general settings data
 * @returns Whether either legacy Google stats field is present
 */
const hasLegacyGoogleStats = (data: Record<string, unknown> | undefined) =>
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
          draft: null,
          shouldCleanPublishedGoogleStats,
        },
      };
    }

    const rawDraft = draftSnap.data();
    const parsedDraft = generalSettingsDraftSchema.safeParse(rawDraft);
    if (!parsedDraft.success) {
      return { success: false, error: SETTINGS_ERRORS.VALIDATION_FAILED };
    }

    return {
      success: true,
      data: {
        draft: parsedDraft.data,
        shouldCleanPublishedGoogleStats,
      },
    };
  } catch {
    console.error("Failed to prepare general settings publish");
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }
};

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
  if (!prepared.draft && !prepared.shouldCleanPublishedGoogleStats) {
    return { success: true, data: { published: false } };
  }

  try {
    const settingsCollection = db.collection("settings");
    const publishedData: Record<string, unknown> = {
      googleStats: FieldValue.delete(),
      googleProfileLastCheckedAt: FieldValue.delete(),
    };
    if (prepared.draft) {
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

    const batch = db.batch();
    batch.set(
      settingsCollection.doc("general"),
      publishedData,
      { merge: true },
    );
    if (prepared.draft) {
      batch.set(
        settingsCollection.doc(GENERAL_SETTINGS_DRAFT_DOCUMENT_ID),
        {
          googleStats: FieldValue.delete(),
          googleProfileLastCheckedAt: FieldValue.delete(),
        },
        { merge: true },
      );
    }
    await batch.commit();
    return { success: true, data: { published: true } };
  } catch {
    console.error("Failed to publish general settings");
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }
};
