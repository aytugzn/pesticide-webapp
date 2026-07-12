import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { parsePestDoc, parseRegionDoc, parseSettingsDoc } from "@/utils/parsers";
import { cacheLife, cacheTag } from "next/cache";
import type { GlobalData } from "./types";

/**
 * Fetches globally shared public data without importing admin auth guards.
 *
 * @returns Active pests, active regions, and general settings.
 */
export const getGlobalData = async (): Promise<GlobalData> => {
  "use cache";
  cacheLife("max");
  cacheTag("global-data");

  try {
    const [pestsSnap, regionsSnap, settingsSnap] = await Promise.all([
      getAdminDb().collection("pests").where("isActive", "==", true).get(),
      getAdminDb().collection("regions").where("isActive", "==", true).get(),
      getAdminDb().collection("settings").doc("general").get(),
    ]);

    return {
      pests: pestsSnap.docs.map((doc) => parsePestDoc(doc.data())),
      regions: regionsSnap.docs.map((doc) => parseRegionDoc(doc.data())),
      settings: parseSettingsDoc(settingsSnap.data()),
    };
  } catch (error: unknown) {
    console.error("Failed to fetch global data");
    throw error;
  }
};
