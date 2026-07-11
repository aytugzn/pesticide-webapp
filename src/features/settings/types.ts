import type { PestDoc, RegionDoc, SettingsDoc } from "@/types";
import { z } from "zod";
import { saveSiteImagesSchema } from "./schemas";

export const SETTINGS_ERRORS = {
  SETTINGS_NOT_FOUND: "SETTINGS_NOT_FOUND",
  MISSING_PLACE_ID: "MISSING_PLACE_ID",
  INVALID_CONFIGURATION: "INVALID_CONFIGURATION",
  PLACES_API_FAILED: "PLACES_API_FAILED",
  NO_VALID_DATA: "NO_VALID_DATA",
  FETCH_FAILED: "FETCH_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  SAVE_FAILED: "SAVE_FAILED",
} as const;

export type SettingsErrorCode = keyof typeof SETTINGS_ERRORS;
export type SaveSiteImagesInput = z.infer<typeof saveSiteImagesSchema>;

export type GlobalData = {
  pests: PestDoc[];
  regions: RegionDoc[];
  settings: SettingsDoc;
};
