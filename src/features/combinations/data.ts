import "server-only";

import { cacheTag } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { getGlobalData } from "@/features/settings/data";
import { parseCombinationDoc } from "@/utils/parsers";
import type { CombinationDoc } from "@/types";
import { getCombinationCacheTag } from "./constants";
import { getErrorInfo } from "./actions/utils";

/**
 * Fetches a single active public combination without importing admin auth guards.
 *
 * @param regionSlug - Region slug from the public URL.
 * @param pestSlug - Pest slug from the public URL.
 * @returns The active combination document or null.
 */
export const getCombination = async (
  regionSlug: string,
  pestSlug: string,
): Promise<CombinationDoc | null> => {
  "use cache";
  cacheTag(getCombinationCacheTag(regionSlug, pestSlug));
  cacheTag("global-data");

  try {
    const globalData = await getGlobalData();
    const isRegionActive = globalData.regions.some(
      (region) => region.slug === regionSlug,
    );
    const isPestActive = globalData.pests.some(
      (pest) => pest.slug === pestSlug,
    );

    if (!isRegionActive || !isPestActive) {
      return null;
    }

    const docId = `${regionSlug}_${pestSlug}`;
    const snap = await getAdminDb().collection("combinations").doc(docId).get();

    if (!snap.exists) return null;

    const data = parseCombinationDoc(snap.data());
    if (!data.isActive || data.isArchived) return null;

    return data;
  } catch (error: unknown) {
    console.error("Failed to fetch public combination", {
      regionSlug,
      pestSlug,
      error: getErrorInfo(error),
    });
    throw error;
  }
};

/**
 * Fetches active public combination slugs without importing admin auth guards.
 *
 * @returns Active, non-archived combinations with active region and pest slugs.
 */
export const getAllActiveCombinations = async (): Promise<
  { region: string; pest: string }[]
> => {
  "use cache";
  cacheTag("all-combinations");
  cacheTag("global-data");

  try {
    const snap = await getAdminDb()
      .collection("combinations")
      .where("isActive", "==", true)
      .get();

    const globalData = await getGlobalData();
    const activeRegions = new Set(
      globalData.regions.map((region) => region.slug),
    );
    const activePests = new Set(globalData.pests.map((pest) => pest.slug));

    return snap.docs
      .map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          region: String(data.region || ""),
          pest: String(data.pest || ""),
          isArchived: data.isArchived === true,
        };
      })
      .filter(
        (combination) =>
          !combination.isArchived &&
          activeRegions.has(combination.region) &&
          activePests.has(combination.pest),
      )
      .map(({ region, pest }) => ({ region, pest }));
  } catch (error: unknown) {
    console.error("Failed to fetch active public combinations", {
      error: getErrorInfo(error),
    });
    throw error;
  }
};
