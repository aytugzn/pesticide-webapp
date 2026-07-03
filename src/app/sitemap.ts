import type { MetadataRoute } from "next";
import { getAdminDb } from "@/lib/firebase-admin";
import { ROUTES } from "@/constants/routes";
import { DICTIONARY } from "@/constants/dictionary";
import type { CombinationDoc, PestDoc, RegionDoc } from "@/types";

// Revalidation is handled on-demand via cache tags.
// Only routes that exist in the App Router should be emitted.
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DICTIONARY.global.siteUrl;

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}${ROUTES.home}`, priority: 1.0, changeFrequency: "weekly" },
    { url: `${baseUrl}${ROUTES.services}`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${baseUrl}${ROUTES.about}`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}${ROUTES.contact}`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}${ROUTES.regions}`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}${ROUTES.certificates}`, priority: 0.5, changeFrequency: "yearly" },
    { url: `${baseUrl}${ROUTES.privacy}`, priority: 0.2, changeFrequency: "yearly" },
    { url: `${baseUrl}${ROUTES.terms}`, priority: 0.2, changeFrequency: "yearly" },
    { url: `${baseUrl}${ROUTES.kvkk}`, priority: 0.2, changeFrequency: "yearly" },
  ];

  let regionPages: MetadataRoute.Sitemap = [];
  let pestPages: MetadataRoute.Sitemap = [];
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
      return { url: `${baseUrl}${ROUTES.regionBase}/${slug}`, priority: 0.8, changeFrequency: "monthly" };
    });

    const activePests = new Set<string>();
    pestPages = pestsSnap.docs.map((doc) => {
      const { slug } = doc.data() as PestDoc;
      activePests.add(slug);
      return { url: `${baseUrl}${ROUTES.pestBase}/${slug}`, priority: 0.8, changeFrequency: "monthly" };
    });

    combinationPages = combinationsSnap.docs
      .map((doc) => doc.data() as CombinationDoc)
      .filter((data) => activeRegions.has(data.region) && activePests.has(data.pest))
      .map((data) => {
        return { url: `${baseUrl}/${data.region}/${data.pest}`, priority: 0.9, changeFrequency: "monthly" };
      });
  } catch (error) {
    console.error("Failed to generate sitemap", error);
  }

  return [...staticPages, ...regionPages, ...pestPages, ...combinationPages];
};

export default sitemap;
