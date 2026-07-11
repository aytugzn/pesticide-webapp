import type { MetadataRoute } from "next";
import { getAbsoluteUrl } from "@/utils/getAbsoluteUrl";

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
  sitemap: getAbsoluteUrl("/sitemap.xml"),
});

export default robots;
