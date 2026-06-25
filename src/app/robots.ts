import type { MetadataRoute } from "next";

// Brief: /admin/* and /rapor/* -> disallow
// /login -> noindex (handled in metadata, but adding to robots.txt for redundancy)
const robots = (): MetadataRoute.Robots => ({
  rules: [
    {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/rapor/", "/login"],
    },
  ],
  sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://dmrilaclama.com"}/sitemap.xml`,
});

export default robots;
