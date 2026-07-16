import { z } from "zod";
import { SEO_CONTENT_LIMITS } from "@/features/seo-content/constants";

export const appImageSchema = z.object({
  source: z.literal("cloudinary"),
  publicId: z.string().trim().min(1),
  alt: z.string().trim().min(1).max(SEO_CONTENT_LIMITS.IMAGE_ALT),
  assetId: z.string().trim().min(1).optional(),
  version: z.number().int().positive().optional(),
  originalUrl: z.string().trim().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().trim().min(1).optional(),
});

const imageAltSchema = z
  .string()
  .trim()
  .min(1)
  .max(SEO_CONTENT_LIMITS.IMAGE_ALT);
const imageSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/);

export const imageUploadInputSchema = z.discriminatedUnion("target", [
  z.object({
    target: z.literal("pest"),
    slug: imageSlugSchema,
    alt: imageAltSchema,
  }),
  z.object({
    target: z.literal("region"),
    slug: imageSlugSchema,
    alt: imageAltSchema,
  }),
  z.object({ target: z.literal("site-hero"), alt: imageAltSchema }),
  z.object({ target: z.literal("site-why-us"), alt: imageAltSchema }),
  z.object({ target: z.literal("site-services"), alt: imageAltSchema }),
]);

export const cloudinaryUploadResponseSchema = z.object({
  public_id: z.string().trim().min(1),
  secure_url: z.string().trim().url(),
  asset_id: z.string().trim().min(1).optional(),
  version: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().trim().min(1).optional(),
});

export const cloudinaryDestroyResponseSchema = z.object({
  result: z.enum(["ok", "not found"]),
});
