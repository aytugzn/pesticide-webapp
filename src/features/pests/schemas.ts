import { z } from "zod";
import { RESERVED_SLUGS } from "@/constants/routes";
import { appImageSchema } from "@/features/image-upload/schemas";
import { SEO_CONTENT_LIMITS } from "@/features/seo-content/constants";

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/)
  .refine((val) => !(RESERVED_SLUGS as readonly string[]).includes(val), {
    message: "Bu kelime sistem tarafından rezerve edilmiştir ve kullanılamaz.",
  });

export const generatedContentSchema = z.object({
  title: z.string().trim().min(1).max(SEO_CONTENT_LIMITS.TITLE),
  description: z.string().trim().min(1).max(300),
  cardDescription: z.string().trim().max(SEO_CONTENT_LIMITS.CARD_DESCRIPTION).optional(),
  h1: z.string().trim().min(1).max(SEO_CONTENT_LIMITS.H1),
  metaDesc: z.string().trim().min(1).max(SEO_CONTENT_LIMITS.META_DESCRIPTION),
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

export const generatePestContentSchema = z.object({
  name: z.string().trim().min(1).max(SEO_CONTENT_LIMITS.NAME),
  description: z.string().trim(),
});

export const savePestSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(SEO_CONTENT_LIMITS.NAME),
  description: z.string().optional(),
  image: appImageSchema.optional(),
  imageUrl: z.string().optional(),
  content: generatedContentSchema,
  isActive: z.boolean(),
});

export const updatePestSchema = z.object({
  name: z.string().trim().min(1).max(SEO_CONTENT_LIMITS.NAME),
  description: z.string().optional(),
  cardDescription: z.string().trim().max(SEO_CONTENT_LIMITS.CARD_DESCRIPTION).optional(),
  image: appImageSchema.nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  title: z.string().trim().min(1).max(SEO_CONTENT_LIMITS.TITLE),
  h1: z.string().trim().min(1).max(SEO_CONTENT_LIMITS.H1),
  metaDesc: z.string().trim().min(1).max(SEO_CONTENT_LIMITS.META_DESCRIPTION),
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
