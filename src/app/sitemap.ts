import type { MetadataRoute } from "next";
import { ROUTES } from "@/constants/routes";
import { getAbsoluteUrl } from "@/utils/getAbsoluteUrl";
import { cacheLife, cacheTag } from "next/cache";
import { resolvePublishedSnapshot } from "@/lib/resolvePublishedSnapshot";
import {
  getVisibleCombinationsById,
  getVisibleGlobalData,
} from "@/lib/publicSnapshot";

const getCachedPublishedSitemapData = async () => {
  "use cache";
  cacheLife("max");
  cacheTag("global-data", "all-combinations");

  const snapshot = await resolvePublishedSnapshot();
  const { regions, pests } = getVisibleGlobalData(snapshot);
  const visibleCombinations = Object.values(
    getVisibleCombinationsById(snapshot),
  );

  return { regions, pests, visibleCombinations };
};

/**
 * Generates the public sitemap from the strict published provider chain
 * (Firestore → Redis last-known-good).
 *
 * If both providers fail, AppError propagates and the sitemap is not generated
 * with empty entity lists. This prevents a transient provider outage from
 * silently removing real public URLs from the sitemap.
 *
 * Revalidation is primarily handled on-demand via cache tags (`updateTag`).
 * Additionally, `cacheLife("max")` ensures a 30-day server revalidation cycle.
 * Only routes that exist in the App Router should be emitted.
 */
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const { regions, pests, visibleCombinations } = await getCachedPublishedSitemapData();

  const staticPages: MetadataRoute.Sitemap = [
    { url: getAbsoluteUrl(ROUTES.home), priority: 1.0, changeFrequency: "weekly" },
    { url: getAbsoluteUrl(ROUTES.services), priority: 0.9, changeFrequency: "monthly" },
    { url: getAbsoluteUrl(ROUTES.about), priority: 0.7, changeFrequency: "monthly" },
    { url: getAbsoluteUrl(ROUTES.contact), priority: 0.8, changeFrequency: "monthly" },
    { url: getAbsoluteUrl(ROUTES.regions), priority: 0.8, changeFrequency: "monthly" },
    { url: getAbsoluteUrl(ROUTES.certificates), priority: 0.5, changeFrequency: "yearly" },
    { url: getAbsoluteUrl(ROUTES.privacy), priority: 0.2, changeFrequency: "yearly" },
    { url: getAbsoluteUrl(ROUTES.terms), priority: 0.2, changeFrequency: "yearly" },
    { url: getAbsoluteUrl(ROUTES.kvkk), priority: 0.2, changeFrequency: "yearly" },
  ];

  const regionPages: MetadataRoute.Sitemap = regions.map(({ slug }) => ({
    url: getAbsoluteUrl(`${ROUTES.regionBase}/${slug}`),
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  const pestPages: MetadataRoute.Sitemap = pests.map(({ slug }) => ({
    url: getAbsoluteUrl(`${ROUTES.pestBase}/${slug}`),
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  const regionHubSlugs = Array.from(new Set(visibleCombinations.map((combination) => combination.region)));
  const regionServiceHubPages: MetadataRoute.Sitemap = regionHubSlugs.map((slug) => ({
    url: getAbsoluteUrl(`${ROUTES.regionBase}/${slug}${ROUTES.services}`),
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  const pestHubSlugs = Array.from(new Set(visibleCombinations.map((combination) => combination.pest)));
  const pestRegionHubPages: MetadataRoute.Sitemap = pestHubSlugs.map((slug) => ({
    url: getAbsoluteUrl(`${ROUTES.pestBase}/${slug}${ROUTES.regions}`),
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  const combinationPages: MetadataRoute.Sitemap = visibleCombinations.map((combination) => ({
    url: getAbsoluteUrl(`/${combination.region}/${combination.pest}`),
    priority: 0.9,
    changeFrequency: "monthly",
  }));

  return [
    ...staticPages,
    ...regionPages,
    ...pestPages,
    ...regionServiceHubPages,
    ...pestRegionHubPages,
    ...combinationPages,
  ];
};

export default sitemap;
