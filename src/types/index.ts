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

export type CombinationDoc = { region: string; pest: string; title?: string; h1?: string; metaDesc?: string; content?: string; faq?: { question: string; answer: string }[]; ogImage?: string; isActive?: boolean; };

export type ActionResponse<T = void, E = string> =
  | { success: true; data?: T }
  | { success: false; error: E; message?: string };
