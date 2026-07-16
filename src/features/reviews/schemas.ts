import { z } from "zod";
import { REVIEW_LIMITS } from "./constants";

const optionalHttpsUrlSchema = z
  .string()
  .trim()
  .max(REVIEW_LIMITS.URL)
  .refine((value) => {
    if (!value) return true;

    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  })
  .transform((value) => value || undefined);

const optionalViewAllUrlSchema = z
  .string()
  .trim()
  .max(REVIEW_LIMITS.URL)
  .refine((value) => {
    if (!value || value === "#") return true;

    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  })
  .transform((value) => value || undefined);

export const reviewItemSchema = z.object({
  id: z.string().trim().min(1).max(REVIEW_LIMITS.ID),
  authorName: z.string().trim().min(1).max(REVIEW_LIMITS.AUTHOR_NAME),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(1).max(REVIEW_LIMITS.TEXT),
  authorPhotoUrl: optionalHttpsUrlSchema.optional(),
  reviewUrl: optionalHttpsUrlSchema.optional(),
});

export const saveReviewsDraftSchema = z.object({
  items: z.array(reviewItemSchema).max(REVIEW_LIMITS.MAX_ITEMS),
  viewAllUrl: optionalViewAllUrlSchema.optional(),
});
