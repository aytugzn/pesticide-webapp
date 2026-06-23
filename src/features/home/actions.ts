import { adminDb } from "@/lib/firebase-admin";
import type { ActionResponse, HeroSlideDoc, GoogleReviewDoc } from "./types";
import type { SettingsDoc, PestDoc } from "@/types";
import { parseSettingsDoc, parsePestDoc } from "@/utils/parsers";
import { unstable_cacheTag as cacheTag } from "next/cache";

export type HomeData = {
  slides: HeroSlideDoc[];
  settings: SettingsDoc;
  pests: PestDoc[];
  customReviews: GoogleReviewDoc[];
  viewAllReviewsUrl: string;
};


export async function getHomeData(): Promise<ActionResponse<HomeData>> {
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
        slides = data.slides.map((s: any) => ({
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
        customReviews = data.items.map((r: any) => ({
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
    console.error("Home page data fetch error:", error);
    return { success: false, error: "FETCH_FAILED" };
  }
}
