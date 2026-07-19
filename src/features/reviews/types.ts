import { z } from "zod";
import type { DraftCommitStatus } from "@/types";
import type { reviewItemSchema, saveReviewsDraftSchema } from "./schemas";

export const REVIEW_ERRORS = {
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  FETCH_FAILED: "FETCH_FAILED",
  SAVE_FAILED: "SAVE_FAILED",
} as const;

export type ReviewErrorCode = keyof typeof REVIEW_ERRORS;
export type ReviewItem = z.infer<typeof reviewItemSchema>;
export type SaveReviewsDraftInput = z.input<typeof saveReviewsDraftSchema>;
export type AdminReviewsData = {
  items: ReviewItem[];
  viewAllUrl?: string;
};

export type PublishReviewsResult = {
  published: boolean;
  status: DraftCommitStatus;
};
