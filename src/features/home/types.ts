export type HeroSlideDoc = { 
  id?: string; 
  imageUrl: string; 
  altText?: string; 
  order: number; 
};

export type GoogleReviewDoc = {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  authorPhotoUrl?: string;
  reviewUrl?: string;
};

export type GoogleStatsDoc = {
  rating: string;
  reviewCount: string;
};

export const HOME_ERRORS = {
  FETCH_FAILED: "FETCH_FAILED",
  PLACES_API_FAILED: "PLACES_API_FAILED",
  NO_VALID_DATA: "NO_VALID_DATA",
  INVALID_CONFIGURATION: "INVALID_CONFIGURATION"
} as const;

export type HomeErrorCode = keyof typeof HOME_ERRORS;

export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: HomeErrorCode };
