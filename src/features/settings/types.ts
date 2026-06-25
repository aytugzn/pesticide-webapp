import type { PestDoc, RegionDoc, SettingsDoc } from "@/types";

export const SETTINGS_ERRORS = {
  SETTINGS_NOT_FOUND: "SETTINGS_NOT_FOUND",
  MISSING_PLACE_ID: "MISSING_PLACE_ID",
  INVALID_CONFIGURATION: "INVALID_CONFIGURATION",
  PLACES_API_FAILED: "PLACES_API_FAILED",
  NO_VALID_DATA: "NO_VALID_DATA",
  FETCH_FAILED: "FETCH_FAILED",
} as const;

export type SettingsErrorCode = keyof typeof SETTINGS_ERRORS;

export type GlobalData = {
  pests: PestDoc[];
  regions: RegionDoc[];
  settings: SettingsDoc;
};
