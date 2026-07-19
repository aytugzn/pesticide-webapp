import "server-only";

import {
  hasFirebaseAdminConfig,
} from "@/lib/firebase-admin";
import { getPublishedSnapshotFromFirestoreOrThrow } from "@/lib/firestorePublishedSnapshot";
import {
  getHomeDataFromSnapshot,
  getLocalHomeDataFallback,
} from "@/lib/publicSnapshot";
import {
  type HomeData,
  type HomeErrorCode,
} from "./types";
import type { ActionResponse } from "@/types";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";

/** Fetches home data only from the Firestore published envelope. */
export const getHomeDataFromFirestore = async (): Promise<HomeData> => {
  "use cache";
  cacheLife("max");
  cacheTag("home-data");

  return (await getPublishedSnapshotFromFirestoreOrThrow()).data.homeData;
};

/**
 * Resolves home data without caching Redis or local fallback payloads as the
 * successful primary result.
 */
export const getHomeData = async (): Promise<
  ActionResponse<HomeData, HomeErrorCode>
> => {
  await connection();
  if (hasFirebaseAdminConfig()) {
    try {
      return { success: true, data: await getHomeDataFromFirestore() };
    } catch {
      console.error("Failed to fetch home page data");
    }
  }
  return {
    success: true,
    data: (await getHomeDataFromSnapshot()) ?? getLocalHomeDataFallback(),
  };
};
