import type { SiteImageSlideDoc } from "@/types";

export type HeroSlideDoc = SiteImageSlideDoc;

export type GoogleReviewDoc = {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  authorPhotoUrl?: string;
  reviewUrl?: string;
};

export type GoogleStatsData = {
  rating: number;
  reviewCount: number;
};

export type GoogleStatsState =
  | { status: "success"; data: GoogleStatsData }
  | { status: "empty" | "error"; data: null };

export type GoogleStatsPromise = Promise<GoogleStatsState>;

export const HOME_ERRORS = {
  FETCH_FAILED: "FETCH_FAILED",
} as const;

export type HomeErrorCode = keyof typeof HOME_ERRORS;

export type HomeData = {
  slides: HeroSlideDoc[];
  customReviews: GoogleReviewDoc[];
  viewAllReviewsUrl: string;
};
export type HomePageData = HomeData & {
  reviewsUnavailable: boolean;
};


export const CONTACT_ERRORS = {
  VALIDATION_FAILED: "VALIDATION_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  PENDING_LIMIT_REACHED: "PENDING_LIMIT_REACHED",
  SAVE_FAILED: "SAVE_FAILED",
} as const;

export type ContactErrorCode = (typeof CONTACT_ERRORS)[keyof typeof CONTACT_ERRORS];
