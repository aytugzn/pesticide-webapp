import { z } from "zod";
import { DICTIONARY } from "@/constants/dictionary";
import { appImageSchema } from "@/features/image-upload/schemas";
import { normalizeTurkishPhone } from "@/utils/phone";
import {
  SITE_IMAGE_GROUP_MAX_IMAGES,
  SLIDER_AUTOPLAY_DELAY_MAX_SECONDS,
  SLIDER_AUTOPLAY_DELAY_MIN_SECONDS,
  GOOGLE_PLACE_ID_MAX_LENGTH,
} from "./constants";

const validation = DICTIONARY.admin.settings.general.validation;

const requiredTextSchema = z.string().trim().min(1, validation.required);
const optionalTextSchema = z.string().trim();
const phoneSchema = requiredTextSchema.refine((value) => {
  return /^\+90[1-9]\d{9}$/.test(normalizeTurkishPhone(value));
}, validation.phone);
const emailSchema = requiredTextSchema.email(validation.email);

/**
 * Builds an optional HTTPS social URL schema for approved provider hosts.
 *
 * @param allowedHosts - Accepted provider root domains
 * @param message - DICTIONARY validation message
 * @returns A trimmed optional URL schema restricted to the provider hosts
 */
const optionalSocialUrlSchema = (
  allowedHosts: readonly string[],
  message: string,
) =>
  optionalTextSchema.refine((value) => {
    if (!value) return true;

    try {
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
      return (
        url.protocol === "https:" &&
        allowedHosts.some(
          (host) => hostname === host || hostname.endsWith(`.${host}`),
        )
      );
    } catch {
      return false;
    }
  }, message);
const instagramUrlSchema = optionalSocialUrlSchema(
  ["instagram.com"],
  validation.instagramUrl,
);
const facebookUrlSchema = optionalSocialUrlSchema(
  ["facebook.com", "fb.com"],
  validation.facebookUrl,
);
const googlePlaceIdSchema = optionalTextSchema.max(
  GOOGLE_PLACE_ID_MAX_LENGTH,
  validation.googlePlaceId,
);
const sliderDelayStringSchema = z
  .string()
  .trim()
  .refine((value) => /^\d+$/.test(value), validation.sliderDelay)
  .transform(Number)
  .refine(
    (value) =>
      Number.isInteger(value) &&
      value >= SLIDER_AUTOPLAY_DELAY_MIN_SECONDS &&
      value <= SLIDER_AUTOPLAY_DELAY_MAX_SECONDS,
    validation.sliderDelay,
  );
const sliderDelayNumberSchema = z
  .number()
  .int(validation.sliderDelay)
  .min(SLIDER_AUTOPLAY_DELAY_MIN_SECONDS, validation.sliderDelay)
  .max(SLIDER_AUTOPLAY_DELAY_MAX_SECONDS, validation.sliderDelay);

const managedSlideSchema = z
  .object({
    id: z.string().trim().min(1),
    image: appImageSchema.optional(),
    imageUrl: z.string().trim().min(1).optional(),
    altText: z.string().trim().min(1).max(200),
    order: z.number().int().nonnegative(),
  })
  .refine((slide) => Boolean(slide.image || slide.imageUrl), {
    message: DICTIONARY.admin.settings.siteImages.validationError,
  });

export const saveSiteImagesSchema = z.object({
  heroSlides: z.array(managedSlideSchema).max(SITE_IMAGE_GROUP_MAX_IMAGES),
  whyUsSlides: z.array(managedSlideSchema).max(SITE_IMAGE_GROUP_MAX_IMAGES),
  servicesSlides: z.array(managedSlideSchema).max(SITE_IMAGE_GROUP_MAX_IMAGES),
});

export const generalSettingsDraftSchema = z.object({
  phone: phoneSchema,
  email: emailSchema,
  address: requiredTextSchema.max(500, validation.addressLength),
  workingHours: requiredTextSchema.max(250, validation.workingHoursLength),
  instagramUrl: instagramUrlSchema,
  facebookUrl: facebookUrlSchema,
  googlePlaceId: googlePlaceIdSchema.optional(),
  heroAutoplayDelay: sliderDelayNumberSchema,
  servicesAutoplayDelay: sliderDelayNumberSchema,
  whyUsAutoplayDelay: sliderDelayNumberSchema,
  reviewsAutoplayDelay: sliderDelayNumberSchema,
});

export const saveGeneralSettingsSchema = z
  .object({
    phone: phoneSchema,
    email: emailSchema,
    address: requiredTextSchema.max(500, validation.addressLength),
    workingHours: requiredTextSchema.max(250, validation.workingHoursLength),
    instagramUrl: instagramUrlSchema,
    facebookUrl: facebookUrlSchema,
    googlePlaceId: googlePlaceIdSchema,
    heroAutoplayDelay: sliderDelayStringSchema,
    servicesAutoplayDelay: sliderDelayStringSchema,
    whyUsAutoplayDelay: sliderDelayStringSchema,
    reviewsAutoplayDelay: sliderDelayStringSchema,
  })
  .transform((data) => ({
    phone: data.phone,
    email: data.email,
    address: data.address,
    workingHours: data.workingHours,
    instagramUrl: data.instagramUrl,
    facebookUrl: data.facebookUrl,
    googlePlaceId: data.googlePlaceId,
    heroAutoplayDelay: data.heroAutoplayDelay,
    servicesAutoplayDelay: data.servicesAutoplayDelay,
    whyUsAutoplayDelay: data.whyUsAutoplayDelay,
    reviewsAutoplayDelay: data.reviewsAutoplayDelay,
  }));
