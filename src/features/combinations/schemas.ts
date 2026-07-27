import { z } from "zod";
import { SEO_LIMITS } from "./constants";
import { SEO_CONTENT_LIMITS } from "@/features/seo-content/constants";
import {
  COMBINATION_ERRORS,
  COMBINATION_JOB_ERRORS,
  type CombinationJobFailureCode,
} from "./types";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/);

export const combinationSlugParamsSchema = z.object({
  regionSlug: slugSchema,
  pestSlug: slugSchema,
});

export const generatedContentSchema = z.object({
  title: z.string().trim().min(1).max(SEO_LIMITS.TITLE_MAX_LENGTH),
  h1: z.string().trim().min(1).max(SEO_LIMITS.H1_MAX_LENGTH),
  metaDesc: z.string().trim().min(1).max(SEO_LIMITS.META_DESC_MAX_LENGTH),
  content: z.string().trim().min(1),
  faq: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(SEO_CONTENT_LIMITS.FAQ_QUESTION),
        answer: z.string().trim().min(1).max(SEO_CONTENT_LIMITS.FAQ_ANSWER),
      }),
    )
    .min(1)
    .max(10),
});

export const saveCombinationSchema = combinationSlugParamsSchema.extend({
  regionName: z.string().trim().min(1).max(120),
  pestName: z.string().trim().min(1).max(120),
  content: generatedContentSchema,
  isActive: z.boolean(),
});

export const toggleCombinationSchema = combinationSlugParamsSchema.extend({
  isActive: z.boolean(),
});

export const unarchiveCombinationSchema = combinationSlugParamsSchema;

export const updateCombinationSchema = combinationSlugParamsSchema.extend({
  content: generatedContentSchema,
});

export const bulkCombinationMutationSchema = z
  .object({
    regionSlug: slugSchema.optional(),
    pestSlug: slugSchema.optional(),
    operation: z.enum(["deactivate", "archive", "restore", "delete"]),
  })
  .refine((value) => !!value.regionSlug || !!value.pestSlug, {
    path: ["regionSlug"],
  });

const bulkJobStatusSchema = z.enum([
  "pending",
  "generating",
  "done",
  "error",
]);

const bulkJobInputItemSchema = z
  .object({
    regionSlug: slugSchema,
    regionName: z.string().trim().min(1).max(120),
    pestSlug: slugSchema,
    pestName: z.string().trim().min(1).max(120),
  })
  .strict();

const bulkProgressItemSchema = bulkJobInputItemSchema.extend({
  status: bulkJobStatusSchema,
  attemptCount: z.number().int().nonnegative().max(3).default(0),
  error: z.string().trim().min(1).max(120).optional(),
});

const combinationJobFailureCodeSchema = z.enum(
  [
    ...Object.values(COMBINATION_ERRORS),
    ...Object.values(COMBINATION_JOB_ERRORS),
  ] as [CombinationJobFailureCode, ...CombinationJobFailureCode[]],
);

const combinationJobStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "aborted",
  "failed",
  "stale",
]);

export const combinationJobIdSchema = z.uuid();

export const startCombinationJobSchema = z
  .array(bulkJobInputItemSchema)
  .min(1)
  .max(1000);

export const combinationBulkJobDocSchema = z
  .object({
    id: combinationJobIdSchema,
    type: z.literal("bulkCombinationGeneration"),
    status: combinationJobStatusSchema,
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative(),
    startedAt: z.number().int().nonnegative().optional(),
    finishedAt: z.number().int().nonnegative().optional(),
    heartbeatAt: z.number().int().nonnegative().optional(),
    total: z.number().int().positive().max(1000),
    doneCount: z.number().int().nonnegative().max(1000),
    errorCount: z.number().int().nonnegative().max(1000),
    currentIndex: z.number().int().nonnegative().max(1000).default(0),
    abortRequested: z.boolean(),
    failedIndex: z.number().int().nonnegative().max(999).optional(),
    failureCode: combinationJobFailureCodeSchema.optional(),
    workerRunId: z.string().trim().min(1).max(160).optional(),
    items: z.array(bulkProgressItemSchema).min(1).max(1000),
  })
  .strict();

export const workerArgumentsSchema = z.object({
  jobId: combinationJobIdSchema,
});
