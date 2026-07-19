import type {
  DraftCommitStatus,
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
  status: DraftCommitStatus;
  cleanupStatus: SiteImagesCleanupStatus;
};

export type PublishGeneralSettingsResult = {
  published: boolean;
  status: DraftCommitStatus;
};

export type PublicSnapshotStatus =
  | "not-needed"
  | "initialized"
  | "updated"
  | "stale"
  | "failed";

export type GlobalPublishResult = Omit<PublishSiteImagesResult, "status"> & {
  generalSettingsPublished: boolean;
  reviewsPublished: boolean;
  snapshotStatus: PublicSnapshotStatus;
  domainPartialFailure: boolean;
  partialFailure: boolean;
  cacheInvalidationAttempted: boolean;
  cacheInvalidated: boolean;
  cacheInvalidationFailed: boolean;
  activationPending: boolean;
  activationDeferred: boolean;
  draftsFinalized: boolean;
  draftFinalizationFailed: boolean;
  newerDraftPreserved: boolean;
  staleDraftSkipped: boolean;
  trueNoOp: boolean;
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
