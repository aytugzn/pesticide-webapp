import { z } from "zod";
import { appImageSchema } from "@/features/image-upload/schemas";

const managedHeroSlideSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    image: appImageSchema.optional(),
    imageUrl: z.string().trim().min(1).optional(),
    altText: z.string().trim().max(200).optional(),
    order: z.number().int().nonnegative(),
  })
  .refine((slide) => Boolean(slide.image || slide.imageUrl), {
    message: "Hero slide requires an image reference",
  });

export const saveSiteImagesSchema = z.object({
  heroSlides: z.array(managedHeroSlideSchema).max(10),
  whyUsImage: appImageSchema.nullable().optional(),
  servicesImage: appImageSchema.nullable().optional(),
});
