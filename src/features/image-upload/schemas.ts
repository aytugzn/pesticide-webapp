import { z } from "zod";

export const appImageSchema = z.object({
  source: z.literal("cloudinary"),
  publicId: z.string().trim().min(1),
  alt: z.string().trim().min(1).max(200),
  assetId: z.string().trim().min(1).optional(),
  version: z.number().int().positive().optional(),
  originalUrl: z.string().trim().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().trim().min(1).optional(),
});

export const imageUploadInputSchema = z.object({
  entity: z.enum(["pest", "region"]),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
  alt: z.string().trim().min(1).max(200),
});

export const cloudinaryUploadResponseSchema = z.object({
  public_id: z.string().trim().min(1),
  secure_url: z.string().trim().url(),
  asset_id: z.string().trim().min(1).optional(),
  version: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().trim().min(1).optional(),
});
