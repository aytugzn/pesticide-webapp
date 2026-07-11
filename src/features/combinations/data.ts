import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { getGlobalData } from "@/features/settings/data";
import { parseCombinationDoc } from "@/utils/parsers";
import type { CombinationDoc } from "@/types";
import { getCombinationCacheTag } from "./constants";
import { getErrorInfo } from "./actions/utils";

export type ActivePublicCombination = {
  region: string;
  pest: string;
  regionName: string;
  pestName: string;
  title?: string;
  h1?: string;
  metaDesc?: string;
};

const isAddressableCombination = (
  docId: string,
  combination: CombinationDoc,
) =>
  !!combination.region &&
  !!combination.pest &&
  docId === `${combination.region}_${combination.pest}`;

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
  cacheLife("max");
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
 * Fetches active public combinations without importing admin auth guards.
 *
 * @returns Active, non-archived, URL-addressable combinations with active region and pest data.
 */
export const getAllActiveCombinations = async (): Promise<ActivePublicCombination[]> => {
  "use cache";
  cacheLife("max");
  cacheTag("all-combinations");
  cacheTag("global-data");

  try {
    const snap = await getAdminDb()
      .collection("combinations")
      .where("isActive", "==", true)
      .get();

    const { regions, pests } = await getGlobalData();
    const activeRegions = new Map(
      regions.map((region) => [region.slug, region.name]),
    );
    const activePests = new Map(pests.map((pest) => [pest.slug, pest.name]));

    return snap.docs
      .map((doc) => {
        const data = parseCombinationDoc(doc.data());
        return { id: doc.id, data };
      })
      .filter(
        ({ id, data }) =>
          isAddressableCombination(id, data) &&
          !data.isArchived &&
          activeRegions.has(data.region) &&
          activePests.has(data.pest),
      )
      .map(({ data }) => ({
        region: data.region,
        pest: data.pest,
        regionName: data.regionName || activeRegions.get(data.region) || data.region,
        pestName: data.pestName || activePests.get(data.pest) || data.pest,
        title: data.title,
        h1: data.h1,
        metaDesc: data.metaDesc,
      }));
  } catch (error: unknown) {
    console.error("Failed to fetch active public combinations", {
      error: getErrorInfo(error),
    });
    throw error;
  }
};
