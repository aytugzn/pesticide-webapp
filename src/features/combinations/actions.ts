"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";

import { parseCombinationDoc } from "@/utils/parsers";
import { cacheTag, updateTag } from "next/cache";
import type { ActionResponse, CombinationDoc } from "@/types";
import { COMBINATION_ERRORS, type CombinationErrorCode, type GeneratedContent, type CombinationRow, type CombinationLightRow } from "./types";
import { getCombinationCacheTag } from "./constants";
import { saveCombinationSchema, toggleCombinationSchema, updateCombinationSchema } from "./schemas";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { getGlobalData } from "@/features/settings/actions";
import { getErrorInfo } from "./actions/utils";


/**
 * Fetches a single combination for the public page.
 * Cached via "use cache" + cacheTag for on-demand revalidation.
 *
 * @param regionSlug - The region slug from the URL
 * @param pestSlug - The pest slug from the URL
 * @returns The parsed CombinationDoc or null
 */
export const getCombination = async (regionSlug: string, pestSlug: string): Promise<CombinationDoc | null> => {
  "use cache";
  cacheTag(getCombinationCacheTag(regionSlug, pestSlug));
  cacheTag("global-data");

  try {
    const globalData = await getGlobalData();
    const isRegionActive = globalData.regions.some((r) => r.slug === regionSlug);
    const isPestActive = globalData.pests.some((p) => p.slug === pestSlug);

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
    const errorInfo = getErrorInfo(error);
    console.error("Failed to fetch combinations", { regionSlug, pestSlug, error: errorInfo });
    throw error;
  }
};



/**
 * Saves a combination to Firestore and invalidates the relevant cache tag.
 * Uses updateTag for read-your-writes semantics per Next.js 16 standards.
 *
 * @param regionSlug - The region slug
 * @param pestSlug - The pest slug
 * @param content - The content fields to save
 * @param isActive - Whether the page should be publicly visible
 * @returns Success or error
 */
export const saveCombination = async (
  regionSlug: string,
  pestSlug: string,
  regionName: string,
  pestName: string,
  content: GeneratedContent,
  isActive: boolean
): Promise<ActionResponse<void, CombinationErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  const parsed = saveCombinationSchema.safeParse({
    regionSlug,
    pestSlug,
    regionName,
    pestName,
    content,
    isActive,
  });

  if (!parsed.success) {
    return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const {
      regionSlug: parsedRegionSlug,
      pestSlug: parsedPestSlug,
      regionName: parsedRegionName,
      pestName: parsedPestName,
      content: parsedContent,
      isActive: parsedIsActive,
    } = parsed.data;
    const docId = `${parsedRegionSlug}_${parsedPestSlug}`;

    const docData: CombinationDoc = {
      region: parsedRegionSlug,
      pest: parsedPestSlug,
      regionName: parsedRegionName,
      pestName: parsedPestName,
      title: parsedContent.title,
      h1: parsedContent.h1,
      metaDesc: parsedContent.metaDesc,
      content: parsedContent.content,
      faq: parsedContent.faq,
      isActive: parsedIsActive,
    };

    const docRef = getAdminDb().collection("combinations").doc(docId);
    await docRef.create(docData);

    // Invalidate cache with read-your-writes semantics
    updateTag(getCombinationCacheTag(parsedRegionSlug, parsedPestSlug));
    updateTag("all-combinations");

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to create combination", { regionSlug, pestSlug, error: errorInfo });

    if (errorInfo.code === "6" || errorInfo.message?.includes("ALREADY_EXISTS")) {
      return { success: false, error: COMBINATION_ERRORS.ALREADY_EXISTS };
    }

    return { success: false, error: COMBINATION_ERRORS.SAVE_FAILED };
  }
};

/**
 * Updates an existing combination content.
 *
 * @param regionSlug - The region slug
 * @param pestSlug - The pest slug
 * @param content - The generated content fields
 * @returns Success or error
 */
export const updateCombination = async (
  regionSlug: string,
  pestSlug: string,
  content: GeneratedContent
): Promise<ActionResponse<void, CombinationErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  const parsed = updateCombinationSchema.safeParse({
    regionSlug,
    pestSlug,
    content,
  });

  if (!parsed.success) {
    return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const { regionSlug: parsedRegion, pestSlug: parsedPest, content: parsedContent } = parsed.data;
    const docId = `${parsedRegion}_${parsedPest}`;

    const docRef = getAdminDb().collection("combinations").doc(docId);

    // update() will throw if the document does not exist.
    await docRef.update({
      title: parsedContent.title,
      h1: parsedContent.h1,
      metaDesc: parsedContent.metaDesc,
      content: parsedContent.content,
      faq: parsedContent.faq,
      updatedAt: Date.now(),
    });

    // We only need to update the specific combination tag since isActive and slugs do not change.
    updateTag(getCombinationCacheTag(parsedRegion, parsedPest));

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to update combination", { regionSlug, pestSlug, error: errorInfo });

    if (errorInfo.code === "5" || errorInfo.message?.includes("NOT_FOUND")) {
      return { success: false, error: COMBINATION_ERRORS.NOT_FOUND };
    }

    return { success: false, error: COMBINATION_ERRORS.UPDATE_FAILED };
  }
};



/**
 * Toggles the isActive status of a combination.
 *
 * @param regionSlug - The region slug
 * @param pestSlug - The pest slug
 * @param isActive - The new active status
 * @returns Success or error
 */
export const toggleCombinationStatus = async (
  regionSlug: string,
  pestSlug: string,
  isActive: boolean
): Promise<ActionResponse<void, CombinationErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  const parsed = toggleCombinationSchema.safeParse({ regionSlug, pestSlug, isActive });

  if (!parsed.success) {
    return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const { regionSlug: parsedRegion, pestSlug: parsedPest, isActive: parsedIsActive } = parsed.data;
    const docId = `${parsedRegion}_${parsedPest}`;

    // Using update instead of set with merge to avoid creating orphan docs.
    // This will throw if the document doesn't exist.
    await getAdminDb().collection("combinations").doc(docId).update({ isActive: parsedIsActive });

    updateTag(getCombinationCacheTag(parsedRegion, parsedPest));
    updateTag("all-combinations");

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);

    console.error("Failed to update combination status", {
      regionSlug,
      pestSlug,
      error: errorInfo
    });

    if (errorInfo.code === "5" || errorInfo.message?.includes("NOT_FOUND")) {
      return { success: false, error: COMBINATION_ERRORS.NOT_FOUND };
    }

    return { success: false, error: COMBINATION_ERRORS.SAVE_FAILED };
  }
};

/**
 * Fetches lightweight combination rows for the admin table view.
 * Only fetches id, region, pest, isActive and enriches with region/pest display names.
 *
 * @returns Array of CombinationLightRow objects
 */
export const getAdminCombinationsPage = async (
  pageSize: number = 50,
  cursor: string | null = null
): Promise<ActionResponse<{ items: CombinationLightRow[]; nextCursor: string | null; hasMore: boolean }, CombinationErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  const validPageSize = Math.min(Math.max(pageSize, 1), 100);

  try {
    const globalData = await getGlobalData();

    // Build lookup maps for display names
    const regionMap = new Map<string, string>();
    globalData.regions.forEach((d) => regionMap.set(d.slug, d.name));

    const pestMap = new Map<string, string>();
    globalData.pests.forEach((d) => pestMap.set(d.slug, d.name));

    let query = getAdminDb()
      .collection("combinations")
      .select("region", "pest", "isActive", "regionName", "pestName", "isArchived")
      .orderBy("__name__")
      .limit(validPageSize + 1);

    if (cursor) {
      query = query.startAfter(cursor);
    }

    const combSnap = await query.get();

    const hasMore = combSnap.docs.length > validPageSize;
    const docsToReturn = hasMore ? combSnap.docs.slice(0, validPageSize) : combSnap.docs;

    const rows: CombinationLightRow[] = docsToReturn.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        region: data.region || "",
        pest: data.pest || "",
        isActive: data.isActive ?? false,
        isArchived: typeof data.isArchived === "boolean" ? data.isArchived : false,
        regionName: data.regionName || regionMap.get(data.region || "") || data.region,
        pestName: data.pestName || pestMap.get(data.pest || "") || data.pest,
      };
    });

    const nextCursor = rows.length > 0 && hasMore ? rows[rows.length - 1].id : null;

    return { success: true, data: { items: rows, nextCursor, hasMore } };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to fetch paginated lightweight combinations", { error: errorInfo });
    return { success: false, error: COMBINATION_ERRORS.FETCH_FAILED };
  }
};

/**
 * Fetches a single combination with full details for admin edit modal.
 *
 * @param regionSlug - The region slug
 * @param pestSlug - The pest slug
 * @returns CombinationRow object
 */
export const getAdminCombination = async (
  regionSlug: string,
  pestSlug: string
): Promise<ActionResponse<CombinationRow, CombinationErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  try {
    const docId = `${regionSlug}_${pestSlug}`;
    const snap = await getAdminDb().collection("combinations").doc(docId).get();

    if (!snap.exists) {
      return { success: false, error: COMBINATION_ERRORS.NOT_FOUND };
    }

    const data = parseCombinationDoc(snap.data());

    const globalData = await getGlobalData();
    const regionName = globalData.regions.find(r => r.slug === regionSlug)?.name || data.regionName;
    const pestName = globalData.pests.find(p => p.slug === pestSlug)?.name || data.pestName;

    return {
      success: true,
      data: {
        id: docId,
        ...data,
        regionName,
        pestName
      }
    };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to fetch full admin combination", { regionSlug, pestSlug, error: errorInfo });
    return { success: false, error: COMBINATION_ERRORS.FETCH_FAILED };
  }
};

/**
 * Fetches all active combinations for generateStaticParams and sitemap.
 * Lightweight: only returns region and pest slugs.
 *
 * @returns Array of { region, pest } objects
 */
export const getAllActiveCombinations = async (): Promise<{ region: string; pest: string }[]> => {
  "use cache";
  cacheTag("all-combinations");
  cacheTag("global-data");

  try {
    const snap = await getAdminDb().collection("combinations").where("isActive", "==", true).get();

    const globalData = await getGlobalData();
    const activeRegions = new Set(globalData.regions.map((r) => r.slug));
    const activePests = new Set(globalData.pests.map((p) => p.slug));

    return snap.docs
      .map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          region: String(data.region || ""),
          pest: String(data.pest || ""),
        };
      })
      .filter((combo) => activeRegions.has(combo.region) && activePests.has(combo.pest));
  } catch (error: unknown) {
    console.error("Failed to fetch active combinations", { error });
    throw error;
  }
};

/**
 * Archives a combination in Firestore and invalidates the relevant cache tag.
 *
 * @param regionSlug - The region slug
 * @param pestSlug - The pest slug
 * @returns Success or error
 */
export const archiveCombination = async (
  regionSlug: string,
  pestSlug: string
): Promise<ActionResponse<void, CombinationErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  try {
    const docId = `${regionSlug}_${pestSlug}`;
    const docRef = getAdminDb().collection("combinations").doc(docId);

    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return { success: false, error: COMBINATION_ERRORS.NOT_FOUND };
    }

    await docRef.update({
      isArchived: true,
      isActive: false,
      archivedAt: Date.now(),
      updatedAt: Date.now()
    });

    updateTag(getCombinationCacheTag(regionSlug, pestSlug));
    updateTag("all-combinations");

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to archive combination", { regionSlug, pestSlug, error: errorInfo });
    return { success: false, error: COMBINATION_ERRORS.ARCHIVE_FAILED };
  }
};

/**
 * Loads an existing combination for admin editing.
 *
 * @param regionSlug - The region slug
 * @param pestSlug - The pest slug
 * @returns The combination data or null
 */
export const loadCombination = async (
  regionSlug: string,
  pestSlug: string
): Promise<ActionResponse<CombinationDoc, CombinationErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  try {
    const docId = `${regionSlug}_${pestSlug}`;
    const snap = await getAdminDb().collection("combinations").doc(docId).get();

    if (!snap.exists) {
      return { success: false, error: COMBINATION_ERRORS.NOT_FOUND };
    }

    return { success: true, data: parseCombinationDoc(snap.data()) };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to fetch combinations", { regionSlug, pestSlug, error: errorInfo });
    return { success: false, error: COMBINATION_ERRORS.FETCH_FAILED };
  }
};
