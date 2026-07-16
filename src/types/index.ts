export type AppImage = {
  source: "cloudinary";
  publicId: string;
  alt: string;
  assetId?: string;
  version?: number;
  originalUrl?: string;
  width?: number;
  height?: number;
  format?: string;
};

export type SiteImageSlideDoc = {
  id: string;
  order: number;
  image?: AppImage;
  imageUrl?: string;
  altText: string;
};

export type PestDoc = { name: string; slug: string; description?: string; cardDescription?: string; image?: AppImage; imageUrl?: string; isActive?: boolean; title?: string; h1?: string; metaDesc?: string; content?: string; faq?: { question: string; answer: string }[]; };
export type RegionDoc = { name: string; slug: string; description?: string; cardDescription?: string; image?: AppImage; imageUrl?: string; isActive?: boolean; title?: string; h1?: string; metaDesc?: string; content?: string; faq?: { question: string; answer: string }[]; };

export type SettingsDoc = {
  phone?: string;
  email?: string;
  address?: string;
  workingHours?: string;
  defaultOgImage?: string;
  whyUsImage?: AppImage;
  whyUsSlides?: SiteImageSlideDoc[];
  servicesImage?: AppImage;
  servicesSlides?: SiteImageSlideDoc[];
  heroAutoplayDelay?: number;
  servicesAutoplayDelay?: number;
  reviewsAutoplayDelay?: number;
  googlePlaceId?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  googleStats?: {
    rating: string;
    reviewCount: string;
    lastUpdatedAt?: number;
  };
};

export type CombinationDoc = { region: string; pest: string; regionName?: string; pestName?: string; title?: string; h1?: string; metaDesc?: string; content?: string; faq?: { question: string; answer: string }[]; ogImage?: string; isActive?: boolean; isArchived?: boolean; archivedAt?: number; };

export type ActionResponse<T = void, E = string> =
  | { success: true; data?: T }
  | { success: false; error: E; message?: string };

export type ContactRequestStatus = "pending" | "resolved";

export type ContactRequestDoc = {
  id?: string;
  ip?: string;
  ipHash?: string;
  phoneHash?: string;
  name: string;
  phone: string;
  service?: string;
  region?: string;
  status: ContactRequestStatus;
  createdAt: number;
  telegramMessageId?: number;
  telegramChatId?: string;
  notificationStatus?: "pending" | "sent" | "failed";
};
