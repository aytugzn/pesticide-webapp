import type { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebase-admin";

// Brief §5 — sitemap.ts logic:
// Static pages + active regions + active pests + active combinations
// Combinations get highest priority (0.9) — most SEO-valuable pages

import type { RegionDoc, PestDoc, CombinationDoc } from "@/types";

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dmrilaclama.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`,                     priority: 1.0, changeFrequency: "weekly" },
    { url: `${baseUrl}/hizmetler`,            priority: 0.9, changeFrequency: "monthly" },
    { url: `${baseUrl}/hakkimizda`,           priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/iletisim`,             priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/izinler-sertifikalar`, priority: 0.6, changeFrequency: "yearly" },
  ];

  const [regionsSnap, pestsSnap, combinationsSnap] = await Promise.all([
    adminDb.collection("regions").where("isActive", "==", true).get(),
    adminDb.collection("pests").where("isActive", "==", true).get(),
    adminDb.collection("combinations").where("isActive", "==", true).get(),
  ]);

  const regionPages: MetadataRoute.Sitemap = regionsSnap.docs.map((doc) => {
    const { slug } = doc.data() as RegionDoc;
    return { url: `${baseUrl}/bolge/${slug}`, priority: 0.8, changeFrequency: "monthly" };
  });

  const pestPages: MetadataRoute.Sitemap = pestsSnap.docs.map((doc) => {
    const { slug } = doc.data() as PestDoc;
    return { url: `${baseUrl}/hasere/${slug}`, priority: 0.8, changeFrequency: "monthly" };
  });

  // Most valuable pages: /[region-slug]/[pest-slug]
  const combinationPages: MetadataRoute.Sitemap = combinationsSnap.docs.map((doc) => {
    const { region, pest } = doc.data() as CombinationDoc;
    return { url: `${baseUrl}/${region}/${pest}`, priority: 0.9, changeFrequency: "monthly" };
  });

  return [...staticPages, ...regionPages, ...pestPages, ...combinationPages];
};

export default sitemap;
