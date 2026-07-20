import "server-only";

import { hasFirebaseAdminConfig } from "@/lib/firebase-admin";
import { getPublishedSnapshotFromFirestoreOrThrow } from "@/lib/firestorePublishedSnapshot";
import {
  getLocalHomeDataFallback,
  getPublicSnapshotResolution,
} from "@/lib/publicSnapshot";
import type { HomeData, HomeErrorCode, HomePageData } from "./types";
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
  ActionResponse<HomePageData, HomeErrorCode>
> => {
  await connection();
  if (hasFirebaseAdminConfig()) {
    try {
      return {
        success: true,
        data: {
          ...(await getHomeDataFromFirestore()),
          reviewsUnavailable: false,
        },
      };
    } catch {
      console.warn("Failed to fetch home page data; using public fallback");
    }
  }
  const snapshotResolution = await getPublicSnapshotResolution();
  if (snapshotResolution.status === "available") {
    return {
      success: true,
      data: {
        ...snapshotResolution.snapshot.data.homeData,
        reviewsUnavailable: false,
      },
    };
  }

  return {
    success: true,
    data: {
      ...getLocalHomeDataFallback(),
      reviewsUnavailable: true,
    },
  };
};
