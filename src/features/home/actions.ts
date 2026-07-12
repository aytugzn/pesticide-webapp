import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { HOME_ERRORS, type HomeData, type HomeErrorCode, type HeroSlideDoc, type GoogleReviewDoc } from "./types";
import type { ActionResponse } from "@/types";
import { cacheLife, cacheTag } from "next/cache";
import { parseHeroSlideDoc, parseGoogleReviewDoc } from "@/utils/parsers";

export const getHomeData = async (): Promise<ActionResponse<HomeData, HomeErrorCode>> => {
  "use cache";
  cacheLife("max");
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
        slides = data.slides
          .map((s, index) => parseHeroSlideDoc(s, index))
          .filter((s): s is HeroSlideDoc => s !== null);
      }
    }

    if (reviewsSnap.exists) {
      const data = reviewsSnap.data();
      if (data && Array.isArray(data.items)) {
        customReviews = data.items
          .map((r, index) => parseGoogleReviewDoc(r, index))
          .filter((r): r is GoogleReviewDoc => r !== null);
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
  } catch {
    console.error("Failed to fetch home page data");
    return { success: false, error: HOME_ERRORS.FETCH_FAILED };
  }
};
