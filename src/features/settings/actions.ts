import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { parsePestDoc, parseRegionDoc, parseSettingsDoc } from "@/utils/parsers";
import { DICTIONARY } from "@/constants/dictionary";
import { cacheTag, updateTag } from "next/cache";
import type { ActionResponse } from "@/types";
import { SETTINGS_ERRORS, type SettingsErrorCode, type GlobalData } from "./types";

/**
 * Fetches globally shared data (pests, regions, settings).
 * - Next.js `"use cache"` inherently handles both cross-request caching AND intra-request deduplication.
 */
export const getGlobalData = async (): Promise<GlobalData> => {
  "use cache";
  cacheTag("global-data");

  try {
    const [pestsSnap, regionsSnap, settingsSnap] = await Promise.all([
      getAdminDb().collection("pests").where("isActive", "==", true).get(),
      getAdminDb().collection("regions").where("isActive", "==", true).get(),
      getAdminDb().collection("settings").doc("general").get(),
    ]);

    return {
      pests: pestsSnap.docs.map((doc) => parsePestDoc(doc.data())),
      regions: regionsSnap.docs.map((doc) => parseRegionDoc(doc.data())),
      settings: parseSettingsDoc(settingsSnap.data()),
    };
  } catch (error) {
    console.error("Failed to fetch global data", error);
    return { pests: [], regions: [], settings: {} };
  }
};

/**
 * Server Action to fetch Google Places stats and update Firestore.
 * Can be triggered by an Admin manually, or via a Cron Job.
 */
export const syncGooglePlacesStats = async (): Promise<ActionResponse<void, SettingsErrorCode>> => {
  try {
    // 1. Get current settings to find googlePlaceId
    const settingsDoc = await getAdminDb().collection("settings").doc("general").get();
    
    if (!settingsDoc.exists) {
      return { success: false, error: SETTINGS_ERRORS.SETTINGS_NOT_FOUND };
    }

    const settingsData = settingsDoc.data();
    const placeId = settingsData?.googlePlaceId;

    if (!placeId) {
      return { success: false, error: SETTINGS_ERRORS.MISSING_PLACE_ID };
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error(DICTIONARY.systemErrors.env.googlePlaces);
      return { success: false, error: SETTINGS_ERRORS.INVALID_CONFIGURATION };
    }

    // 2. Fetch from Google
    const url = `https://places.googleapis.com/v1/places/${placeId}?languageCode=tr`;
    
    // We don't cache this fetch because this is an explicit on-demand sync
    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount'
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(DICTIONARY.systemErrors.api.googlePlacesFailed, { status: response.status, details: errText });
      return { success: false, error: SETTINGS_ERRORS.PLACES_API_FAILED };
    }

    const data = await response.json();

    if (!data.rating && !data.userRatingCount) {
      console.warn(DICTIONARY.systemErrors.api.googlePlacesNoData);
      return { success: false, error: SETTINGS_ERRORS.NO_VALID_DATA };
    }

    const rating = data.rating?.toFixed(1) || "-";
    const reviewCount = data.userRatingCount?.toString() || "0";

    // 3. Update Firestore with new data
    await getAdminDb().collection("settings").doc("general").set({
      googleStats: {
        rating,
        reviewCount,
        lastUpdatedAt: Date.now(),
      }
    }, { merge: true });

    // Invalidate global settings cache with read-your-writes semantics
    updateTag("global-data");
    updateTag("layout-settings");

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(DICTIONARY.systemErrors.api.googlePlacesFailed, { error: errorMessage });
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }
};
