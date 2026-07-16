"use server";

import "server-only";

import { updateTag } from "next/cache";
import type { ActionResponse } from "@/types";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { getAdminDb } from "@/lib/firebase-admin";
import { publishSiteImagesDraft } from "./publishSiteImages";
import {
  SETTINGS_ERRORS,
  type PublishSiteImagesResult,
  type SettingsErrorCode,
} from "./types";

/**
 * Runs the site-image publish step while preserving the global cache refresh
 * behavior used by layout, sitemap, combinations, and other public consumers.
 *
 * @returns Global refresh plus optional image publish/cleanup status
 */
export const revalidateAll = async (): Promise<
  ActionResponse<PublishSiteImagesResult, SettingsErrorCode>
> => {
  if (!(await requireAdmin())) {
    return { success: false, error: SETTINGS_ERRORS.UNAUTHORIZED };
  }

  const publishResult = await publishSiteImagesDraft(getAdminDb());

  if (!publishResult.success) {
    updateTag("layout-settings");
    updateTag("all-combinations");
    return publishResult;
  }

  if (!publishResult.data?.published) {
    updateTag("global-data");
    updateTag("home-data");
  }

  updateTag("layout-settings");
  updateTag("all-combinations");

  return publishResult;
};
