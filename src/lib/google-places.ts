import type { GoogleStatsDoc, ActionResponse } from "@/features/home/types";
import { unstable_cacheTag as cacheTag } from "next/cache";

/**
 * Fetches ratings and review counts from Google Places API.
 * The results are aggressively cached to prevent hitting API quotas.
 * 
 * @param placeId - The unique Google Place ID for the business
 * @returns ActionResponse containing GoogleStatsDoc or error
 */
export async function getGooglePlaceDetails(placeId?: string): Promise<ActionResponse<{ stats: GoogleStatsDoc | null }>> {
  "use cache";
  cacheTag("google-places");

  if (!placeId) {
    return { success: false, error: "INVALID_CONFIGURATION" };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_PLACES_API_KEY is not set in environment variables.");
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
      console.error(`Google Places API returned ${response.status}`);
      return { success: false, error: "PLACES_API_FAILED" };
    }

    const data = await response.json();

    if (!data.rating && !data.userRatingCount) {
      console.warn("Google Places API warning/error: No valid data found in response");
      return { success: false, error: "NO_VALID_DATA" };
    }

    const stats: GoogleStatsDoc = {
      rating: data.rating?.toFixed(1) || "-",
      reviewCount: data.userRatingCount?.toString() || "0"
    };

    return { success: true, data: { stats } };

  } catch (error) {
    console.error("Failed to fetch Google Place details:", error);
    return { success: false, error: "FETCH_FAILED" };
  }
}
