import { SEO_CONTENT_LIMITS } from "@/features/seo-content/constants";

export const SEO_LIMITS = {
  TITLE_MAX_LENGTH: SEO_CONTENT_LIMITS.TITLE,
  H1_MAX_LENGTH: SEO_CONTENT_LIMITS.H1,
  META_DESC_MAX_LENGTH: SEO_CONTENT_LIMITS.META_DESCRIPTION,
} as const;

export const getCombinationCacheTag = (regionSlug: string, pestSlug: string) => `combination-${regionSlug}-${pestSlug}`;
