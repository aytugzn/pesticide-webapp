import type { MetadataRoute } from "next";
import { getAdminDb } from "@/lib/firebase-admin";
import { ROUTES } from "@/constants/routes";
import type { CombinationDoc, PestDoc, RegionDoc } from "@/types";
import { getAbsoluteUrl } from "@/utils/getAbsoluteUrl";

import { cacheTag } from "next/cache";

// Revalidation is handled on-demand via cache tags.
// Only routes that exist in the App Router should be emitted.
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  "use cache";
  cacheTag("global-data");
  cacheTag("all-combinations");

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

  try {
    const [regionsSnap, pestsSnap, combinationsSnap] = await Promise.all([
      getAdminDb().collection("regions").where("isActive", "==", true).get(),
      getAdminDb().collection("pests").where("isActive", "==", true).get(),
      getAdminDb().collection("combinations").where("isActive", "==", true).get(),
    ]);

    const activeRegions = new Set<string>();
    regionPages = regionsSnap.docs.map((doc) => {
      const { slug } = doc.data() as RegionDoc;
      activeRegions.add(slug);
      return { url: getAbsoluteUrl(`${ROUTES.regionBase}/${slug}`), priority: 0.8, changeFrequency: "monthly" };
    });

    const activePests = new Set<string>();
    pestPages = pestsSnap.docs.map((doc) => {
      const { slug } = doc.data() as PestDoc;
      activePests.add(slug);
      return { url: getAbsoluteUrl(`${ROUTES.pestBase}/${slug}`), priority: 0.8, changeFrequency: "monthly" };
    });

    const visibleCombinations = combinationsSnap.docs
      .map((doc) => ({ id: doc.id, data: doc.data() as CombinationDoc }))
      .filter(
        ({ id, data }) =>
          id === `${data.region}_${data.pest}` &&
          !data.isArchived &&
          activeRegions.has(data.region) &&
          activePests.has(data.pest),
      )
      .map(({ data }) => data);

    const regionHubSlugs = Array.from(new Set(visibleCombinations.map((data) => data.region)));
    regionServiceHubPages = regionHubSlugs.map((slug) => ({
      url: getAbsoluteUrl(`${ROUTES.regionBase}/${slug}${ROUTES.services}`),
      priority: 0.8,
      changeFrequency: "monthly",
    }));

    const pestHubSlugs = Array.from(new Set(visibleCombinations.map((data) => data.pest)));
    pestRegionHubPages = pestHubSlugs.map((slug) => ({
      url: getAbsoluteUrl(`${ROUTES.pestBase}/${slug}${ROUTES.regions}`),
      priority: 0.8,
      changeFrequency: "monthly",
    }));

    combinationPages = visibleCombinations.map((data) => {
      return { url: getAbsoluteUrl(`/${data.region}/${data.pest}`), priority: 0.9, changeFrequency: "monthly" };
    });
  } catch (error: unknown) {
    console.error("Failed to generate sitemap", { error: error instanceof Error ? error.message : "Unknown error" });
    throw error;
  }

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
