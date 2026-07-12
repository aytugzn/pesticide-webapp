import { z } from "zod";
import { SEO_LIMITS } from "./constants";

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
        question: z.string().trim().min(1).max(200),
        answer: z.string().trim().min(1).max(800),
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

const bulkProgressItemSchema = z
  .object({
    regionSlug: slugSchema,
    regionName: z.string().trim().min(1).max(120),
    pestSlug: slugSchema,
    pestName: z.string().trim().min(1).max(120),
    status: bulkJobStatusSchema,
    error: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

const jobIdSchema = z.uuid();

export const startCombinationJobSchema = z
  .array(bulkProgressItemSchema)
  .min(1)
  .max(1000);

export const updateCombinationJobItemSchema = z
  .object({
    jobId: jobIdSchema,
    index: z.number().int().nonnegative().max(999),
    patch: z
      .object({
        status: bulkJobStatusSchema.optional(),
        error: z.string().trim().min(1).max(120).optional(),
      })
      .strict()
      .refine((value) => Object.keys(value).length > 0),
  })
  .strict();

export const combinationJobIdSchema = jobIdSchema;

export const finishCombinationJobSchema = z
  .object({
    jobId: jobIdSchema,
    status: z.enum(["completed", "aborted", "failed"]),
  })
  .strict();
