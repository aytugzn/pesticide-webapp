export const ROUTES = {
  login: "/login",
  admin: "/admin",
  adminRegions: "/admin/bolgeler",
  adminPests: "/admin/hasereler",
  adminCombinations: "/admin/kombinasyonlar",
  adminReports: "/admin/raporlar",
  adminMessages: "/admin/mesajlar",
  adminReferences: "/admin/referanslar",
  adminSettings: "/admin/ayarlar",
  
  // Public Routes
  home: "/",
  about: "/hakkimizda",
  contact: "/iletisim",
  pestBase: "/hasere",
  regionBase: "/bolge",
} as const;

export const SESSION_COOKIE_NAME = "admin_session" as const;
