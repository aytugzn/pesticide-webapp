import type { SeoGeneratedContent } from "@/features/seo-content/types";
import { MUTATION_POLICY_ERROR } from "@/constants/mutationPolicy";

export const REGION_ERRORS = {
  [MUTATION_POLICY_ERROR]: MUTATION_POLICY_ERROR,
  FETCH_FAILED: "FETCH_FAILED",
  NOT_FOUND: "NOT_FOUND",
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
  AI_SERVER_BUSY: "AI_SERVER_BUSY",
  AI_QUOTA_EXCEEDED: "AI_QUOTA_EXCEEDED",
  SAVE_FAILED: "SAVE_FAILED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  TOGGLE_FAILED: "TOGGLE_FAILED",
  UPDATE_FAILED: "UPDATE_FAILED",
  DELETE_FAILED: "DELETE_FAILED",
  REGION_IN_USE: "REGION_IN_USE",
} as const;

export type RegionErrorCode = keyof typeof REGION_ERRORS;

export type GeneratedContent = SeoGeneratedContent;

import { z } from "zod";
import { updateRegionSchema } from "./schemas";
export type UpdateRegionInput = z.infer<typeof updateRegionSchema>;
