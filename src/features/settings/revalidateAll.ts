"use server";

import "server-only";

import { updateTag } from "next/cache";
import type { ActionResponse } from "@/types";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { getAdminDb } from "@/lib/firebase-admin";
import { SETTINGS_ERRORS, type SettingsErrorCode } from "./types";

/** Verifies Firestore availability before invalidating public cache tags. */
export const revalidateAll = async (): Promise<
  ActionResponse<void, SettingsErrorCode>
> => {
  if (!(await requireAdmin())) {
    return { success: false, error: SETTINGS_ERRORS.UNAUTHORIZED };
  }

  try {
    await getAdminDb().collection("settings").doc("general").get();

    updateTag("global-data");
    updateTag("home-data");
    updateTag("layout-settings");
    updateTag("all-combinations");

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to revalidate public site", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }
};
