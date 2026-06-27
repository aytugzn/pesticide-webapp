export const SEO_LIMITS = {
  TITLE_MAX_LENGTH: 60,
  H1_MAX_LENGTH: 70,
  META_DESC_MAX_LENGTH: 160,
} as const;

export const getCombinationCacheTag = (regionSlug: string, pestSlug: string) => `combination-${regionSlug}-${pestSlug}`;
