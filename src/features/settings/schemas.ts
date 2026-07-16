import { z } from "zod";
import { appImageSchema } from "@/features/image-upload/schemas";
import { SITE_IMAGE_GROUP_MAX_IMAGES } from "./constants";

const managedSlideSchema = z
  .object({
    id: z.string().trim().min(1),
    image: appImageSchema.optional(),
    imageUrl: z.string().trim().min(1).optional(),
    altText: z.string().trim().min(1).max(200),
    order: z.number().int().nonnegative(),
  })
  .refine((slide) => Boolean(slide.image || slide.imageUrl), {
    message: "Slide requires an image reference",
  });

export const saveSiteImagesSchema = z.object({
  heroSlides: z.array(managedSlideSchema).max(SITE_IMAGE_GROUP_MAX_IMAGES),
  whyUsSlides: z.array(managedSlideSchema).max(SITE_IMAGE_GROUP_MAX_IMAGES),
  servicesSlides: z.array(managedSlideSchema).max(SITE_IMAGE_GROUP_MAX_IMAGES),
});
