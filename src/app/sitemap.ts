import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { ROUTES } from "@/constants/routes";
import { getAllActiveCombinations } from "@/features/combinations/data";
import { getGlobalData } from "@/features/settings/data";
import { getAbsoluteUrl } from "@/utils/getAbsoluteUrl";

// Revalidation is handled on-demand via cache tags.
// Only routes that exist in the App Router should be emitted.
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  await connection();

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

  let regionPages: MetadataRoute.Sitemap = [];
  let pestPages: MetadataRoute.Sitemap = [];
  let regionServiceHubPages: MetadataRoute.Sitemap = [];
  let pestRegionHubPages: MetadataRoute.Sitemap = [];
  let combinationPages: MetadataRoute.Sitemap = [];

  const [{ regions, pests }, visibleCombinations] = await Promise.all([
    getGlobalData(),
    getAllActiveCombinations(),
  ]);

  regionPages = regions.map(({ slug }) => {
    return { url: getAbsoluteUrl(`${ROUTES.regionBase}/${slug}`), priority: 0.8, changeFrequency: "monthly" };
  });

  pestPages = pests.map(({ slug }) => {
    return { url: getAbsoluteUrl(`${ROUTES.pestBase}/${slug}`), priority: 0.8, changeFrequency: "monthly" };
  });

  const regionHubSlugs = Array.from(new Set(visibleCombinations.map((combination) => combination.region)));
  regionServiceHubPages = regionHubSlugs.map((slug) => ({
    url: getAbsoluteUrl(`${ROUTES.regionBase}/${slug}${ROUTES.services}`),
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  const pestHubSlugs = Array.from(new Set(visibleCombinations.map((combination) => combination.pest)));
  pestRegionHubPages = pestHubSlugs.map((slug) => ({
    url: getAbsoluteUrl(`${ROUTES.pestBase}/${slug}${ROUTES.regions}`),
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  combinationPages = visibleCombinations.map((combination) => {
    return { url: getAbsoluteUrl(`/${combination.region}/${combination.pest}`), priority: 0.9, changeFrequency: "monthly" };
  });

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
