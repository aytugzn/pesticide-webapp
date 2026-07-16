import type {
  PestDoc,
  RegionDoc,
  SettingsDoc,
  SiteImageSlideDoc,
} from "@/types";
import { z } from "zod";
import {
  generalSettingsDraftSchema,
  saveGeneralSettingsSchema,
  saveSiteImagesSchema,
} from "./schemas";

export const SETTINGS_ERRORS = {
  FETCH_FAILED: "FETCH_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  SAVE_FAILED: "SAVE_FAILED",
} as const;

export type SettingsErrorCode = keyof typeof SETTINGS_ERRORS;
export type SaveSiteImagesInput = z.infer<typeof saveSiteImagesSchema>;
export type SaveGeneralSettingsInput = z.input<
  typeof saveGeneralSettingsSchema
>;
export type GeneralSettingsDraftData = z.infer<
  typeof generalSettingsDraftSchema
>;
export type GeneralSettingsFormValues = {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  instagramUrl: string;
  facebookUrl: string;
  googlePlaceId: string;
  heroAutoplayDelay: string;
  servicesAutoplayDelay: string;
  whyUsAutoplayDelay: string;
  reviewsAutoplayDelay: string;
};

export type AdminGeneralSettingsData = {
  values: GeneralSettingsFormValues;
};
export type SiteImagesCleanupStatus =
  | "not-needed"
  | "success"
  | "partial-failure";
export type PublishSiteImagesResult = {
  published: boolean;
  cleanupStatus: SiteImagesCleanupStatus;
};

export type PublishGeneralSettingsResult = {
  published: boolean;
};

export type GlobalPublishResult = PublishSiteImagesResult & {
  generalSettingsPublished: boolean;
  reviewsPublished: boolean;
  partialFailure: boolean;
  cacheInvalidationFailed: boolean;
};

export type SiteImagesData = {
  heroSlides: SiteImageSlideDoc[];
  whyUsSlides: SiteImageSlideDoc[];
  servicesSlides: SiteImageSlideDoc[];
};

export type GlobalData = {
  pests: PestDoc[];
  regions: RegionDoc[];
  settings: SettingsDoc;
};
