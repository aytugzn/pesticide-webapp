export type PestDoc = { name: string; slug: string; description?: string; imageUrl?: string; isActive?: boolean };
export type RegionDoc = { name: string; slug: string; description?: string; isActive?: boolean };
export type SettingsDoc = { phone?: string; defaultOgImage?: string; heroAutoplayDelay?: number; servicesAutoplayDelay?: number; reviewsAutoplayDelay?: number; googlePlaceId?: string; instagramUrl?: string; facebookUrl?: string; };
export type CombinationDoc = { region: string; pest: string; title?: string; h1?: string; metaDesc?: string; content?: string; faq?: { question: string; answer: string }[]; ogImage?: string; isActive?: boolean; };

export type ActionResponse<T = void, E = string> =
  | { success: true; data?: T }
  | { success: false; error: E; details?: unknown };
