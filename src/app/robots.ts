import type { MetadataRoute } from "next";

// Brief: /admin/* ve /rapor/* → disallow
// /login → noindex (metadata'da yönetiliyor, ama robots.txt'te de güvende olsun)
const robots = (): MetadataRoute.Robots => ({
  rules: [
    {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/rapor/", "/login"],
    },
  ],
  sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
});

export default robots;
