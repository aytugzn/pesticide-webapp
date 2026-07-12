import { z } from "zod";
import { appImageSchema } from "@/features/image-upload/schemas";

const managedSlideSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    image: appImageSchema.optional(),
    imageUrl: z.string().trim().min(1).optional(),
    altText: z.string().trim().max(200).optional(),
    order: z.number().int().nonnegative(),
  })
  .refine((slide) => Boolean(slide.image || slide.imageUrl), {
    message: "Slide requires an image reference",
  });

export const saveSiteImagesSchema = z.object({
  heroSlides: z.array(managedSlideSchema).max(10),
  whyUsSlides: z.array(managedSlideSchema).max(10),
  servicesSlides: z.array(managedSlideSchema).max(10),
});
