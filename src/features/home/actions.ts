import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { HOME_ERRORS, type HomeData, type HomeErrorCode, type HeroSlideDoc, type GoogleReviewDoc } from "./types";
import type { ActionResponse } from "@/types";
import { DICTIONARY } from "@/constants/dictionary";
import { cacheTag } from "next/cache";

export const getHomeData = async (): Promise<ActionResponse<HomeData, HomeErrorCode>> => {
  "use cache";
  cacheTag("home-data");

  try {
    const [sliderSnap, reviewsSnap] = await Promise.all([
      getAdminDb().collection("settings").doc("heroSlider").get(),
      getAdminDb().collection("settings").doc("reviews").get()
    ]);

    let slides: HeroSlideDoc[] = [];
    let customReviews: GoogleReviewDoc[] = [];
    let viewAllReviewsUrl: string = "#";

    if (sliderSnap.exists) {
      const data = sliderSnap.data();
      if (data && Array.isArray(data.slides)) {
        slides = data.slides.map((s: Record<string, unknown>) => ({
          ...s,
          imageUrl: String(s.imageUrl || ""),
          order: Number(s.order) || 0
        })) as HeroSlideDoc[];
      }
    }

    if (reviewsSnap.exists) {
      const data = reviewsSnap.data();
      if (data && Array.isArray(data.items)) {
        customReviews = data.items.map((r: Record<string, unknown>) => ({
          ...r,
          rating: Number(r.rating) || 5
        })) as GoogleReviewDoc[];
      }
      if (data && data.viewAllUrl) {
        viewAllReviewsUrl = String(data.viewAllUrl);
      }
    }

    return {
      success: true,
      data: {
        slides,
        customReviews,
        viewAllReviewsUrl
      }
    };
  } catch (error) {
    console.error(DICTIONARY.systemErrors.logs.homeDataFetch, error);
    return { success: false, error: HOME_ERRORS.FETCH_FAILED };
  }
};
