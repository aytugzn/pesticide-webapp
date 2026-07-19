import type { CombinationDoc, PublicMutationResult } from "@/types";

export const COMBINATION_ERRORS = {
  FETCH_FAILED: "FETCH_FAILED",
  NOT_FOUND: "NOT_FOUND",
  REGION_NOT_FOUND: "REGION_NOT_FOUND",
  PEST_NOT_FOUND: "PEST_NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  ARCHIVED_EXISTS: "ARCHIVED_EXISTS",
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
  SAVE_FAILED: "SAVE_FAILED",
  ARCHIVE_FAILED: "ARCHIVE_FAILED",
  UNARCHIVE_FAILED: "UNARCHIVE_FAILED",
  RELATED_ENTITY_MISSING: "RELATED_ENTITY_MISSING",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  UPDATE_FAILED: "UPDATE_FAILED",
  AI_QUOTA_EXCEEDED: "AI_QUOTA_EXCEEDED",
  AI_PROVIDER_UNAVAILABLE: "AI_PROVIDER_UNAVAILABLE",
  BULK_NO_FILTER: "BULK_NO_FILTER",
  BULK_NO_MATCH: "BULK_NO_MATCH",
  BULK_MUTATION_FAILED: "BULK_MUTATION_FAILED",
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
  isArchived?: boolean;
  archivedAt?: number;
};

export type CombinationLightRow = {
  id: string;
  region: string;
  pest: string;
  isActive: boolean;
  regionName?: string;
  pestName?: string;
  isArchived?: boolean;
};

export type CombinationsPageResponse = {
  items: CombinationLightRow[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type AdminCombinationListFilter = "all" | "archived";

export type BulkCombinationMutationOperation = "deactivate" | "archive" | "restore" | "delete";

export type BulkCombinationMutationInput = {
  regionSlug?: string;
  pestSlug?: string;
  operation: BulkCombinationMutationOperation;
};

export type BulkCombinationMutationResult = PublicMutationResult & {
  affectedCount: number;
  affectedKeys?: string[];
  affectedRows?: CombinationLightRow[];
  matchedCount?: number;
  restoredCount?: number;
  restoredKeys?: string[];
  skippedCount?: number;
  skippedMissingRelatedCount?: number;
  skippedInactiveRelatedCount?: number;
};

export const COMBINATION_JOB_ERRORS = {
  ALREADY_RUNNING: "ALREADY_RUNNING",
  NOT_FOUND: "NOT_FOUND",
  STALE_JOB: "STALE_JOB",
  INVALID_JOB_STATE: "INVALID_JOB_STATE",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type CombinationJobErrorCode = keyof typeof COMBINATION_JOB_ERRORS;

/** Status of a single combination in a bulk generation job */
export type BulkJobStatus = "pending" | "generating" | "done" | "error";

/** Tracks progress of one region-pest pair in a bulk generation run */
export type BulkProgressItem = {
  regionSlug: string;
  regionName: string;
  pestSlug: string;
  pestName: string;
  status: BulkJobStatus;
  error?: string;
};

export type CombinationBulkJobDoc = {
  id: string;
  type: "bulkCombinationGeneration";
  status: "running" | "completed" | "aborted" | "failed" | "stale";
  createdAt: number;
  updatedAt: number;
  heartbeatAt: number;
  total: number;
  doneCount: number;
  errorCount: number;
  abortRequested: boolean;
  items: BulkProgressItem[];
};
