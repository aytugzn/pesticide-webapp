import type { SeoGeneratedContent } from "@/features/seo-content/types";

export const REGION_ERRORS = {
  FETCH_FAILED: "FETCH_FAILED",
  NOT_FOUND: "NOT_FOUND",
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
  AI_SERVER_BUSY: "AI_SERVER_BUSY",
  SAVE_FAILED: "SAVE_FAILED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  TOGGLE_FAILED: "TOGGLE_FAILED",
} as const;

export type RegionErrorCode = keyof typeof REGION_ERRORS;

export type GeneratedContent = SeoGeneratedContent;
