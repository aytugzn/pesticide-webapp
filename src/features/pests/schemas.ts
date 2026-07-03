import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/);

export const generatedContentSchema = z.object({
  title: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(300),
  h1: z.string().trim().min(1).max(70),
  metaDesc: z.string().trim().min(1).max(160),
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

export const savePestSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(120),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  content: generatedContentSchema,
  isActive: z.boolean(),
});

export const updatePestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  title: z.string().trim().min(1).max(60),
  h1: z.string().trim().min(1).max(70),
  metaDesc: z.string().trim().min(1).max(160),
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
