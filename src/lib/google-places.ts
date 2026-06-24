import type { GoogleStatsDoc } from "@/features/home/types";
import type { ActionResponse } from "@/types";
import { cacheTag } from "next/cache";
import { DICTIONARY } from "@/constants/dictionary";

/**
 * Fetches ratings and review counts from Google Places API.
 * The results are aggressively cached to prevent hitting API quotas.
 * 
 * @param placeId - The unique Google Place ID for the business
 * @returns ActionResponse containing GoogleStatsDoc or error
 */
export const getGooglePlaceDetails = async (placeId?: string): Promise<ActionResponse<{ stats: GoogleStatsDoc | null }>> => {
  "use cache";
  cacheTag("google-places");

  if (!placeId) {
    return { success: false, error: "INVALID_CONFIGURATION" };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error(DICTIONARY.systemErrors.env.googlePlaces);
    return { success: false, error: "INVALID_CONFIGURATION" };
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}?languageCode=tr`;
    
    // We use Next.js experimental "use cache"
    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount'
      }
    });

    if (!response.ok) {
      console.error(DICTIONARY.systemErrors.api.googlePlacesFailed, { status: response.status });
      return { success: false, error: "PLACES_API_FAILED" };
    }

    const data = await response.json();

    if (!data.rating && !data.userRatingCount) {
      console.warn(DICTIONARY.systemErrors.api.googlePlacesNoData);
      return { success: false, error: "NO_VALID_DATA" };
    }

    const stats: GoogleStatsDoc = {
      rating: data.rating?.toFixed(1) || "-",
      reviewCount: data.userRatingCount?.toString() || "0"
    };

    return { success: true, data: { stats } };

  } catch (error) {
    console.error(DICTIONARY.systemErrors.api.googlePlacesFailed, error);
    return { success: false, error: "FETCH_FAILED" };
  }
}
