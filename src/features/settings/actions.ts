import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { updateTag } from "next/cache";
import type { ActionResponse } from "@/types";
import { SETTINGS_ERRORS, type SettingsErrorCode } from "./types";
import { requireAdmin } from "@/features/auth/requireAdmin";

/**
 * Server Action to fetch Google Places stats and update Firestore.
 * Can be triggered by an Admin manually, or via a Cron Job.
 */
export const syncGooglePlacesStats = async (): Promise<ActionResponse<void, SettingsErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: SETTINGS_ERRORS.UNAUTHORIZED };
  }

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
      console.error("Missing GOOGLE_PLACES_API_KEY environment variable");
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
      const details = errText.length > 500 ? errText.substring(0, 500) + "..." : errText;
      console.error("Google Places API request failed", { status: response.status, details });
      return { success: false, error: SETTINGS_ERRORS.PLACES_API_FAILED };
    }

    const data = await response.json();

    if (!data.rating && !data.userRatingCount) {
      console.warn("Google Places API returned no valid data");
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
    updateTag("home-data");

    return { success: true };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Google Places API request failed", { error: errorMessage });
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }
};
