import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import {
  hasFirebaseAdminConfig,
} from "@/lib/firebase-admin";
import { getPublishedSnapshotFromFirestoreOrThrow } from "@/lib/firestorePublishedSnapshot";
import {
  getPublicSnapshotResolution,
  getVisibleCombinationsById,
  type PublicDataSnapshot,
} from "@/lib/publicSnapshot";
import type { CombinationDoc, PublicDataResult } from "@/types";
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

/** Converts one canonical combination document into public list data. */
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

/** Resolves a slug pair only after an authoritative snapshot was read. */
export const getCombinationFromPublishedSnapshot = (
  snapshot: PublicDataSnapshot,
  regionSlug: string,
  pestSlug: string,
): PublicDataResult<CombinationDoc> => {
  const combination = getVisibleCombinationsById(snapshot)[
    `${regionSlug}_${pestSlug}`
  ];
  return combination
    ? { status: "found", data: combination }
    : { status: "confirmed-missing" };
};

/**
 * Fetches a single primary combination for the long-lived Next.js cache.
 *
 * @param regionSlug - Region slug from the public URL.
 * @param pestSlug - Pest slug from the public URL.
 * @returns The active combination document or null.
 */
const getCombinationFromFirestore = async (
  regionSlug: string,
  pestSlug: string,
): Promise<CombinationDoc | null> => {
  "use cache";
  cacheLife("max");
  cacheTag(getCombinationCacheTag(regionSlug, pestSlug));
  cacheTag("global-data");

  const snapshot = await getPublishedSnapshotFromFirestoreOrThrow();
  const result = getCombinationFromPublishedSnapshot(
    snapshot,
    regionSlug,
    pestSlug,
  );
  return result.status === "found" ? result.data : null;
};

/**
 * Resolves one public combination through Firestore and the canonical Redis
 * map, returning null instead of manufacturing local dynamic content.
 */
export const getCombination = async (
  regionSlug: string,
  pestSlug: string,
): Promise<PublicDataResult<CombinationDoc>> => {
  await connection();
  if (hasFirebaseAdminConfig()) {
    try {
      const combination = await getCombinationFromFirestore(
        regionSlug,
        pestSlug,
      );
      return combination
        ? { status: "found", data: combination }
        : { status: "confirmed-missing" };
    } catch (error: unknown) {
      console.warn("Failed to fetch public combination", {
        regionSlug,
        pestSlug,
        errorCode: getErrorInfo(error).code,
      });
    }
  }
  const snapshot = await getPublicSnapshotResolution();
  if (snapshot.status !== "available") {
    return { status: "temporarily-unavailable" };
  }

  return getCombinationFromPublishedSnapshot(
    snapshot.snapshot,
    regionSlug,
    pestSlug,
  );
};

/** Resolves combination metadata through the published provider chain. */
export const getCombinationMetadataResult = async (
  regionSlug: string,
  pestSlug: string,
): Promise<PublicDataResult<CombinationDoc>> => {
  await connection();
  if (hasFirebaseAdminConfig()) {
    try {
      const combination = await getCombinationFromFirestore(
        regionSlug,
        pestSlug,
      );
      return combination
        ? { status: "found", data: combination }
        : { status: "confirmed-missing" };
    } catch (error: unknown) {
      console.warn("Failed to fetch combination metadata", {
        regionSlug,
        pestSlug,
        errorCode: getErrorInfo(error).code,
      });
    }
  }
  const snapshot = await getPublicSnapshotResolution();
  if (snapshot.status !== "available") {
    return { status: "temporarily-unavailable" };
  }
  return getCombinationFromPublishedSnapshot(
    snapshot.snapshot,
    regionSlug,
    pestSlug,
  );
};

/**
 * Fetches active public combinations without importing admin auth guards.
 *
 * @returns Active, non-archived, URL-addressable combinations with active region and pest data.
 */
const getAllActiveCombinationsFromFirestore = async (): Promise<
  ActivePublicCombination[]
> => {
  "use cache";
  cacheLife("max");
  cacheTag("all-combinations");
  cacheTag("global-data");

  const snapshot = await getPublishedSnapshotFromFirestoreOrThrow();
  return Object.values(getVisibleCombinationsById(snapshot)).map(
    createActivePublicCombination,
  );
};

/** Resolves the active public list through Firestore, Redis, and an empty fallback. */
export const getAllActiveCombinationsResult = async (): Promise<
  PublicDataResult<ActivePublicCombination[]>
> => {
  await connection();
  if (hasFirebaseAdminConfig()) {
    try {
      return {
        status: "found",
        data: await getAllActiveCombinationsFromFirestore(),
      };
    } catch (error: unknown) {
      console.warn("Failed to fetch active public combinations", {
        errorCode: getErrorInfo(error).code,
      });
    }
  }
  const snapshot = await getPublicSnapshotResolution();
  if (snapshot.status !== "available") {
    return { status: "temporarily-unavailable" };
  }

  const combinationsById = getVisibleCombinationsById(snapshot.snapshot);
  return {
    status: "found",
    data: Object.keys(combinationsById)
      .sort()
      .map((docId) =>
        createActivePublicCombination(combinationsById[docId]),
      ),
  };
};

/** Resolves combination-list metadata through the published provider chain. */
export const getAllActiveCombinationsMetadataResult = async (): Promise<
  PublicDataResult<ActivePublicCombination[]>
> => {
  await connection();
  if (hasFirebaseAdminConfig()) {
    try {
      return {
        status: "found",
        data: await getAllActiveCombinationsFromFirestore(),
      };
    } catch (error: unknown) {
      console.warn("Failed to fetch combination-list metadata", {
        errorCode: getErrorInfo(error).code,
      });
    }
  }
  const snapshot = await getPublicSnapshotResolution();
  if (snapshot.status !== "available") {
    return { status: "temporarily-unavailable" };
  }
  return {
    status: "found",
    data: Object.values(getVisibleCombinationsById(snapshot.snapshot)).map(
      createActivePublicCombination,
    ),
  };
};

/** Preserves the empty-list fallback for non-entity public surfaces. */
export const getAllActiveCombinations = async (): Promise<
  ActivePublicCombination[]
> => {
  const result = await getAllActiveCombinationsResult();
  return result.status === "found" ? result.data : [];
};
