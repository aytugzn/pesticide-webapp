"use server";

import "server-only";

import { updateTag } from "next/cache";
import type { ActionResponse } from "@/types";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  cleanupPublishedSiteImages,
  commitSiteImagesPublish,
  prepareSiteImagesDraftPublish,
} from "./publishSiteImages";
import {
  commitGeneralSettingsPublish,
  prepareGeneralSettingsDraftPublish,
} from "./publishGeneralSettings";
import {
  SETTINGS_ERRORS,
  type GlobalPublishResult,
  type SettingsErrorCode,
} from "./types";

/**
 * Refreshes each global public cache tag exactly once.
 *
 * @returns Nothing after synchronous tag invalidation
 */
const updateGlobalCacheTags = (): void => {
  updateTag("global-data");
  updateTag("home-data");
  updateTag("layout-settings");
  updateTag("all-combinations");
};

/**
 * Refreshes layout and combination responsibilities after domain failure.
 *
 * @returns Nothing after synchronous fallback invalidation
 */
const updateFailureCacheTags = (): void => {
  updateTag("layout-settings");
  updateTag("all-combinations");
};

/**
 * Runs authorized draft preparation, Firestore commits, cache invalidation,
 * and finally Cloudinary cleanup.
 *
 * @returns Detailed domain publish and warning state
 */
export const revalidateAll = async (): Promise<
  ActionResponse<GlobalPublishResult, SettingsErrorCode>
> => {
  if (!(await requireAdmin())) {
    return { success: false, error: SETTINGS_ERRORS.UNAUTHORIZED };
  }

  const db = getAdminDb();
  const [sitePreparation, generalPreparation] = await Promise.all([
    prepareSiteImagesDraftPublish(db),
    prepareGeneralSettingsDraftPublish(db),
  ]);

  const [sitePublish, generalPublish] = await Promise.all([
    sitePreparation.success && sitePreparation.data
      ? commitSiteImagesPublish(db, sitePreparation.data)
      : Promise.resolve({
          success: false as const,
          error: sitePreparation.success
            ? SETTINGS_ERRORS.FETCH_FAILED
            : sitePreparation.error,
        }),
    generalPreparation.success && generalPreparation.data
      ? commitGeneralSettingsPublish(db, generalPreparation.data)
      : Promise.resolve({
          success: false as const,
          error: generalPreparation.success
            ? SETTINGS_ERRORS.FETCH_FAILED
            : generalPreparation.error,
        }),
  ]);
  const siteImagesPublished =
    sitePublish.success && Boolean(sitePublish.data?.published);
  const generalSettingsPublished =
    generalPublish.success && Boolean(generalPublish.data?.published);
  const anyPublished = siteImagesPublished || generalSettingsPublished;
  const anyDomainFailure = !sitePublish.success || !generalPublish.success;

  let cacheInvalidationFailed = false;
  try {
    if (anyPublished || !anyDomainFailure) {
      updateGlobalCacheTags();
    } else {
      updateFailureCacheTags();
    }
  } catch {
    cacheInvalidationFailed = true;
    console.error("Failed to update global cache tags");
  }

  let cleanupStatus: GlobalPublishResult["cleanupStatus"] = "not-needed";
  if (
    !cacheInvalidationFailed &&
    siteImagesPublished &&
    sitePreparation.success &&
    sitePreparation.data
  ) {
    cleanupStatus = await cleanupPublishedSiteImages(
      db,
      sitePreparation.data.cleanupCandidates,
    );
  }

  if (anyDomainFailure && !anyPublished) {
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }

  const partialFailure =
    anyDomainFailure ||
    cacheInvalidationFailed ||
    cleanupStatus === "partial-failure";

  return {
    success: true,
    data: {
      published: siteImagesPublished,
      cleanupStatus,
      generalSettingsPublished,
      partialFailure,
      cacheInvalidationFailed,
    },
  };
};
