"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import type { ActionResponse } from "@/types";
import {
  type SaveGeneralSettingsInput,
  type SaveSiteImagesInput,
  type SettingsErrorCode,
  SETTINGS_ERRORS,
} from "./types";
import { requireAdminMutation } from "@/features/auth/requireAdminMutation";
import {
  saveGeneralSettingsSchema,
  saveSiteImagesSchema,
} from "./schemas";
import {
  GENERAL_SETTINGS_DRAFT_DOCUMENT_ID,
  SITE_IMAGES_DRAFT_DOCUMENT_ID,
} from "./constants";

/**
 * Serializes validated draft slides with canonical ordering.
 *
 * @param slides - Validated site-image slides
 * @returns Firestore-safe slide data without undefined fields
 */
const serializeSiteImageSlides = (
  slides: SaveSiteImagesInput["heroSlides"],
) =>
  slides.map((slide, index) => ({
    id: slide.id,
    ...(slide.image ? { image: slide.image } : {}),
    ...(slide.imageUrl ? { imageUrl: slide.imageUrl } : {}),
    altText: slide.altText,
    order: index,
  }));

/**
 * Saves editable business settings to the isolated general draft document.
 * Public settings and cache tags are intentionally untouched until publish.
 *
 * @param input - Flat client form values
 * @returns A controlled settings action response
 */
export const saveGeneralSettings = async (
  input: SaveGeneralSettingsInput,
): Promise<ActionResponse<void, SettingsErrorCode>> => {
  const guardFailure = await requireAdminMutation(
    "settings-save-general",
    SETTINGS_ERRORS.UNAUTHORIZED,
  );
  if (guardFailure) {
    return guardFailure;
  }

  const parsed = saveGeneralSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: SETTINGS_ERRORS.VALIDATION_FAILED };
  }

  try {
    await getAdminDb()
      .collection("settings")
      .doc(GENERAL_SETTINGS_DRAFT_DOCUMENT_ID)
      .set(parsed.data);
    return { success: true };
  } catch {
    console.error("Failed to save general settings draft");
    return { success: false, error: SETTINGS_ERRORS.SAVE_FAILED };
  }
};

/**
 * Saves admin-managed home visuals to the isolated draft document.
 *
 * @param input - Ordered Hero slides and optional WhyUs/Services images
 * @returns A controlled settings action response
 */
export const saveSiteImages = async (
  input: SaveSiteImagesInput,
): Promise<ActionResponse<void, SettingsErrorCode>> => {
  const guardFailure = await requireAdminMutation(
    "settings-save-site-images",
    SETTINGS_ERRORS.UNAUTHORIZED,
  );
  if (guardFailure) {
    return guardFailure;
  }

  const parsed = saveSiteImagesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: SETTINGS_ERRORS.VALIDATION_FAILED };
  }

  try {
    const db = getAdminDb();
    await db
      .collection("settings")
      .doc(SITE_IMAGES_DRAFT_DOCUMENT_ID)
      .set({
        heroSlides: serializeSiteImageSlides(parsed.data.heroSlides),
        whyUsSlides: serializeSiteImageSlides(parsed.data.whyUsSlides),
        servicesSlides: serializeSiteImageSlides(parsed.data.servicesSlides),
        updatedAt: Date.now(),
      });

    return { success: true };
  } catch {
    console.error("Failed to save site images");
    return { success: false, error: SETTINGS_ERRORS.SAVE_FAILED };
  }
};
