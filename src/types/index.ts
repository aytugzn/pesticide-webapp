export type PestDoc = { name: string; slug: string; description?: string; imageUrl?: string; isActive?: boolean };
export type RegionDoc = { name: string; slug: string; description?: string; isActive?: boolean };

export type SettingsDoc = {
  phone?: string;
  email?: string;
  address?: string;
  workingHours?: string;
  licenseNumber?: string;
  defaultOgImage?: string;
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

export type CombinationDoc = { region: string; pest: string; regionName?: string; pestName?: string; title?: string; h1?: string; metaDesc?: string; content?: string; faq?: { question: string; answer: string }[]; ogImage?: string; isActive?: boolean; };

export type ActionResponse<T = void, E = string> =
  | { success: true; data?: T }
  | { success: false; error: E; message?: string };

export type ContactRequestStatus = "pending" | "resolved";

export type ContactRequestDoc = {
  id?: string;
  ip: string;
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

