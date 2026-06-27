import type { CombinationDoc } from "@/types";

export const COMBINATION_ERRORS = {
  FETCH_FAILED: "FETCH_FAILED",
  NOT_FOUND: "NOT_FOUND",
  REGION_NOT_FOUND: "REGION_NOT_FOUND",
  PEST_NOT_FOUND: "PEST_NOT_FOUND",
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
  SAVE_FAILED: "SAVE_FAILED",
  DELETE_FAILED: "DELETE_FAILED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
} as const;

export type CombinationErrorCode = keyof typeof COMBINATION_ERRORS;

/** Shape returned by the AI generation flow before saving */
export type GeneratedContent = {
  title: string;
  h1: string;
  metaDesc: string;
  content: string;
  faq: { question: string; answer: string }[];
};

/** Row shape for the admin combinations table */
export type CombinationRow = CombinationDoc & {
  id: string;
  regionName?: string;
  pestName?: string;
};
