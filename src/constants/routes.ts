import { deepFreeze } from "../utils/deep-freeze";

export const ROUTES = deepFreeze({
  login: "/login",
  admin: "/admin",
  adminRegions: "/admin/regions",
  adminPests: "/admin/pests",
  adminCombinations: "/admin/combinations",
  adminReports: "/admin/service-reports",
  adminMessages: "/admin/messages",
  adminSettings: "/admin/settings",
  adminReviews: "/admin/reviews",
  
  // Public Routes
  home: "/",
  about: "/hakkimizda",
  services: "/hizmetler",
  contact: "/iletisim",
  pestBase: "/hasere",
  regionBase: "/bolge",
  regions: "/bolgeler",
  certificates: "/izinler-sertifikalar",
  
  // Legal
  privacy: "/gizlilik-politikasi",
  terms: "/kullanim-kosullari",
  kvkk: "/kvkk-aydinlatma-metni",
} as const);

export const RESERVED_SLUGS = [
  "admin",
  "api",
  "login",
  "bolge",
  "bolgeler",
  "hasere",
  "hasereler",
  "hizmet",
  "hizmetler",
  "iletisim",
  "hakkimizda",
  "rapor",
  "robots.txt",
  "sitemap.xml",
  "gizlilik-politikasi",
  "kullanim-kosullari",
  "kvkk-aydinlatma-metni",
  "izinler-sertifikalar",
] as const;

export const SESSION_COOKIE_NAME = "admin_session" as const;
