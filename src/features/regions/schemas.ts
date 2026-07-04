import { z } from "zod";
import { RESERVED_SLUGS } from "@/constants/routes";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/)
  .refine((val) => !(RESERVED_SLUGS as readonly string[]).includes(val), {
    message: "Bu kelime sistem tarafından rezerve edilmiştir ve kullanılamaz.",
  });

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

export const saveRegionSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(120),
  description: z.string().optional(),
  content: generatedContentSchema,
  isActive: z.boolean(),
});

export const updateRegionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().optional(),
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
