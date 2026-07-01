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
