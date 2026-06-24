import { adminDb } from "@/lib/firebase-admin";
import { parsePestDoc, parseRegionDoc, parseSettingsDoc } from "@/utils/parsers";
import { DICTIONARY } from "@/constants/dictionary";
import type { PestDoc, RegionDoc, SettingsDoc } from "@/types";
import { cacheTag } from "next/cache";

export type GlobalData = {
  pests: PestDoc[];
  regions: RegionDoc[];
  settings: SettingsDoc;
};

/**
 * Fetches globally shared data (pests, regions, settings).
 * - Next.js `"use cache"` inherently handles both cross-request caching AND intra-request deduplication.
 */
export const getGlobalData = async (): Promise<GlobalData> => {
  "use cache";
  cacheTag("global-data");

  try {
    const [pestsSnap, regionsSnap, settingsSnap] = await Promise.all([
      adminDb.collection("pests").where("isActive", "==", true).get(),
      adminDb.collection("regions").where("isActive", "==", true).get(),
      adminDb.collection("settings").doc("general").get(),
    ]);

    return {
      pests: pestsSnap.docs.map((doc) => parsePestDoc(doc.data())),
      regions: regionsSnap.docs.map((doc) => parseRegionDoc(doc.data())),
      settings: parseSettingsDoc(settingsSnap.data()),
    };
  } catch (error) {
    console.error(DICTIONARY.systemErrors.logs.globalDataFetch, error);
    return { pests: [], regions: [], settings: {} };
  }
};
