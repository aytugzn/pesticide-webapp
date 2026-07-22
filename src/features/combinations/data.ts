import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { resolvePublishedSnapshot } from "@/lib/resolvePublishedSnapshot";
import {
  getVisibleCombinationsById,
  type PublicDataSnapshot,
} from "@/lib/publicSnapshot";
import type { CombinationDoc } from "@/types";
import { getCombinationCacheTag } from "./constants";

export type ActivePublicCombination = {
  region: string;
  pest: string;
  regionName: string;
  pestName: string;
  title?: string;
  h1?: string;
  metaDesc?: string;
};

type PublishedCombinationResult =
  | { status: "found"; data: CombinationDoc }
  | { status: "confirmed-missing" };

/** Converts one published combination document into public list data. */
const createActivePublicCombination = (
  combination: CombinationDoc,
): ActivePublicCombination => ({
  region: combination.region,
  pest: combination.pest,
  regionName: combination.regionName || combination.region,
  pestName: combination.pestName || combination.pest,
  title: combination.title,
  h1: combination.h1,
  metaDesc: combination.metaDesc,
});

/** Resolves a slug pair after an authoritative snapshot has been read. */
export const getCombinationFromPublishedSnapshot = (
  snapshot: PublicDataSnapshot,
  regionSlug: string,
  pestSlug: string,
): PublishedCombinationResult => {
  const combination =
    getVisibleCombinationsById(snapshot)[`${regionSlug}_${pestSlug}`];

  return combination
    ? { status: "found", data: combination }
    : { status: "confirmed-missing" };
};

/**
 * Fetches a single combination from the published provider chain
 * for the long-lived Next.js cache.
 */
const getCachedPublishedCombination = async (
  regionSlug: string,
  pestSlug: string,
): Promise<CombinationDoc | null> => {
  "use cache";

  cacheLife("max");
  cacheTag(getCombinationCacheTag(regionSlug, pestSlug));
  cacheTag("global-data");

  const snapshot = await resolvePublishedSnapshot();
  const result = getCombinationFromPublishedSnapshot(
    snapshot,
    regionSlug,
    pestSlug,
  );

  return result.status === "found" ? result.data : null;
};

/**
 * Resolves one public combination through the published provider chain
 * without manufacturing local dynamic content.
 */
export const getCombination = async (
  regionSlug: string,
  pestSlug: string,
): Promise<PublishedCombinationResult> => {
  const combination = await getCachedPublishedCombination(
    regionSlug,
    pestSlug,
  );

  return combination
    ? { status: "found", data: combination }
    : { status: "confirmed-missing" };
};

export const getCombinationMetadataResult = async (
  regionSlug: string,
  pestSlug: string,
): Promise<PublishedCombinationResult> =>
  getCombination(regionSlug, pestSlug);

/**
 * Fetches active public combinations from the published provider chain
 * for the long-lived Next.js cache.
 */
const getCachedPublishedActiveCombinations = async (): Promise<
  ActivePublicCombination[]
> => {
  "use cache";

  cacheLife("max");
  cacheTag("all-combinations");
  cacheTag("global-data");

  const snapshot = await resolvePublishedSnapshot();

  return Object.values(getVisibleCombinationsById(snapshot)).map(
    createActivePublicCombination,
  );
};

export const getAllActiveCombinationsResult = async (): Promise<{
  status: "found";
  data: ActivePublicCombination[];
}> => ({
  status: "found",
  data: await getCachedPublishedActiveCombinations(),
});

export const getAllActiveCombinationsMetadataResult = async (): Promise<{
  status: "found";
  data: ActivePublicCombination[];
}> => getAllActiveCombinationsResult();