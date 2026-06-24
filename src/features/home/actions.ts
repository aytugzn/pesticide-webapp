import { adminDb } from "@/lib/firebase-admin";
import type { HeroSlideDoc, GoogleReviewDoc, HomeErrorCode } from "./types";
import { HOME_ERRORS } from "./types";
import type { SettingsDoc, PestDoc } from "@/types";
import type { ActionResponse } from "@/types";
import { DICTIONARY } from "@/constants/dictionary";
import { parseSettingsDoc, parsePestDoc } from "@/utils/parsers";
import { cacheTag } from "next/cache";

export type HomeData = {
  slides: HeroSlideDoc[];
  settings: SettingsDoc;
  pests: PestDoc[];
  customReviews: GoogleReviewDoc[];
  viewAllReviewsUrl: string;
};


export const getHomeData = async (): Promise<ActionResponse<HomeData, HomeErrorCode>> => {
  "use cache";
  cacheTag("home-data");
  
  try {
    const [sliderSnap, settingsSnap, pestsSnap, reviewsSnap] = await Promise.all([
      adminDb.collection("settings").doc("heroSlider").get(),
      adminDb.collection("settings").doc("general").get(),
      adminDb.collection("pests").where("isActive", "==", true).get(),
      adminDb.collection("settings").doc("reviews").get()
    ]);

    let slides: HeroSlideDoc[] = [];
    let settings: SettingsDoc = {};
    let pests: PestDoc[] = [];
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

    if (settingsSnap.exists) {
      settings = parseSettingsDoc(settingsSnap.data());
    }

    if (!pestsSnap.empty) {
      pests = pestsSnap.docs.map(doc => parsePestDoc(doc.data()));
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
        settings,
        pests,
        customReviews,
        viewAllReviewsUrl
      }
    };
  } catch (error) {
    console.error(DICTIONARY.systemErrors.logs.homeDataFetch, error);
    return { success: false, error: HOME_ERRORS.FETCH_FAILED };
  }
}
