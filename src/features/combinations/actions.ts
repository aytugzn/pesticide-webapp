"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";

import { parseCombinationDoc } from "@/utils/parsers";
import { updateTag } from "next/cache";
import type { DocumentReference, Query } from "firebase-admin/firestore";
import type { ActionResponse, CombinationDoc } from "@/types";
import { COMBINATION_ERRORS, type AdminCombinationListFilter, type CombinationErrorCode, type GeneratedContent, type CombinationRow, type CombinationLightRow, type BulkCombinationMutationInput, type BulkCombinationMutationResult } from "./types";
import { getCombinationCacheTag } from "./constants";
import { bulkCombinationMutationSchema, combinationSlugParamsSchema, saveCombinationSchema, toggleCombinationSchema, unarchiveCombinationSchema, updateCombinationSchema } from "./schemas";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { getGlobalData } from "@/features/settings/data";
import { getErrorInfo } from "./actions/utils";

const BULK_COMBINATION_BATCH_SIZE = 400;

type BulkCombinationTarget = {
  ref: DocumentReference;
  region: string;
  pest: string;
  row: CombinationLightRow;
};

type BulkCombinationRestoreSummary = {
  matchedCount: number;
  restoredTargets: BulkCombinationTarget[];
  skippedMissingRelatedCount: number;
  skippedInactiveRelatedCount: number;
};

const getStringField = (data: Record<string, unknown>, key: string) =>
  typeof data[key] === "string" ? data[key] : "";

const getBulkTargetRow = (id: string, data: Record<string, unknown>): CombinationLightRow | null => {
  const region = getStringField(data, "region");
  const pest = getStringField(data, "pest");

  if (!region || !pest) return null;

  const regionName = getStringField(data, "regionName") || region;
  const pestName = getStringField(data, "pestName") || pest;

  return {
    id,
    region,
    pest,
    isActive: data.isActive === true,
    isArchived: data.isArchived === true,
    regionName,
    pestName,
  };
};

const getBulkMutationRow = (
  row: CombinationLightRow,
  operation: BulkCombinationMutationInput["operation"]
): CombinationLightRow => {
  if (operation === "archive") {
    return { ...row, isActive: false, isArchived: true };
  }

  if (operation === "restore") {
    return { ...row, isActive: false, isArchived: false };
  }

  if (operation === "deactivate") {
    return { ...row, isActive: false };
  }

  return row;
};

const getBulkMutationResultPayload = (
  targets: BulkCombinationTarget[],
  operation: BulkCombinationMutationInput["operation"]
) => ({
  affectedKeys: targets.map((target) => target.row.id),
  affectedRows: targets.map((target) => getBulkMutationRow(target.row, operation)),
});


/**
 * Saves a combination to Firestore without publishing cached public content.
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
    const existingSnap = await docRef.get();

    if (existingSnap.exists) {
      const existingData = parseCombinationDoc(existingSnap.data());
      return {
        success: false,
        error: existingData.isArchived
          ? COMBINATION_ERRORS.ARCHIVED_EXISTS
          : COMBINATION_ERRORS.ALREADY_EXISTS,
      };
    }

    await docRef.create(docData);

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to create combination", {
      regionSlug,
      pestSlug,
      errorCode: errorInfo.code,
    });

    if (errorInfo.code === "6" || errorInfo.message?.includes("ALREADY_EXISTS")) {
      try {
        const docId = `${regionSlug}_${pestSlug}`;
        const existingSnap = await getAdminDb().collection("combinations").doc(docId).get();
        if (existingSnap.exists && parseCombinationDoc(existingSnap.data()).isArchived) {
          return { success: false, error: COMBINATION_ERRORS.ARCHIVED_EXISTS };
        }
      } catch (lookupError: unknown) {
        console.error("Failed to inspect existing combination after duplicate create", {
          regionSlug,
          pestSlug,
          errorCode: getErrorInfo(lookupError).code,
        });
      }

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

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to update combination", {
      regionSlug,
      pestSlug,
      errorCode: errorInfo.code,
    });

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
      errorCode: errorInfo.code,
    });

    if (errorInfo.code === "5" || errorInfo.message?.includes("NOT_FOUND")) {
      return { success: false, error: COMBINATION_ERRORS.NOT_FOUND };
    }

    return { success: false, error: COMBINATION_ERRORS.SAVE_FAILED };
  }
};

/**
 * Mutates combinations matching a region and/or pest filter in safe Firestore batch chunks.
 *
 * @param input - Bulk filter and operation
 * @returns Affected combination count or a typed error
 */
export const bulkMutateCombinationsByFilter = async (
  input: BulkCombinationMutationInput
): Promise<ActionResponse<BulkCombinationMutationResult, CombinationErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  const parsed = bulkCombinationMutationSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: COMBINATION_ERRORS.BULK_NO_FILTER };
  }

  const { regionSlug, pestSlug, operation } = parsed.data;

  try {
    const db = getAdminDb();
    const now = Date.now();
    const targets: BulkCombinationTarget[] = [];

    let query: Query = db.collection("combinations").select("region", "pest", "isActive", "regionName", "pestName", "isArchived");

    if (operation === "restore") {
      query = query.where("isArchived", "==", true);
    } else if (regionSlug) {
      query = query.where("region", "==", regionSlug);
    } else if (pestSlug) {
      query = query.where("pest", "==", pestSlug);
    }

    const snap = await query.get();

    snap.docs.forEach((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const row = getBulkTargetRow(doc.id, data);
      if (!row) return;

      const region = row.region;
      const pest = row.pest;
      const matchesRegion = !regionSlug || region === regionSlug;
      const matchesPest = !pestSlug || pest === pestSlug;
      const isArchived = row.isArchived === true;

      if (region && pest && matchesRegion && matchesPest && (operation !== "restore" || isArchived)) {
        targets.push({ ref: doc.ref, region, pest, row });
      }
    });

    if (targets.length === 0) {
      return { success: false, error: COMBINATION_ERRORS.BULK_NO_MATCH };
    }

    let restoreSummary: BulkCombinationRestoreSummary | null = null;
    const mutationTargets: BulkCombinationTarget[] = operation === "restore" ? [] : targets;

    if (operation === "restore") {
      const restoredTargets: BulkCombinationTarget[] = [];
      let skippedMissingRelatedCount = 0;
      let skippedInactiveRelatedCount = 0;
      const relatedCache = new Map<string, { exists: boolean; isActive: boolean }>();

      for (const target of targets) {
        const pestKey = `pest:${target.pest}`;
        const regionKey = `region:${target.region}`;
        let pestState = relatedCache.get(pestKey);
        let regionState = relatedCache.get(regionKey);

        if (!pestState || !regionState) {
          const [pestSnap, regionSnap] = await Promise.all([
            pestState ? Promise.resolve(null) : db.collection("pests").doc(target.pest).get(),
            regionState ? Promise.resolve(null) : db.collection("regions").doc(target.region).get(),
          ]);

          if (!pestState && pestSnap) {
            const data = pestSnap.data() as Record<string, unknown> | undefined;
            pestState = {
              exists: pestSnap.exists,
              isActive: data?.isActive === true,
            };
            relatedCache.set(pestKey, pestState);
          }

          if (!regionState && regionSnap) {
            const data = regionSnap.data() as Record<string, unknown> | undefined;
            regionState = {
              exists: regionSnap.exists,
              isActive: data?.isActive === true,
            };
            relatedCache.set(regionKey, regionState);
          }
        }

        if (!pestState?.exists || !regionState?.exists) {
          skippedMissingRelatedCount += 1;
          continue;
        }

        if (!pestState.isActive || !regionState.isActive) {
          skippedInactiveRelatedCount += 1;
          continue;
        }

        restoredTargets.push(target);
      }

      restoreSummary = {
        matchedCount: targets.length,
        restoredTargets,
        skippedMissingRelatedCount,
        skippedInactiveRelatedCount,
      };
      mutationTargets.push(...restoredTargets);

      if (mutationTargets.length === 0) {
        return {
          success: true,
          data: {
            affectedCount: 0,
            affectedKeys: [],
            affectedRows: [],
            matchedCount: targets.length,
            restoredCount: 0,
            restoredKeys: [],
            skippedCount: skippedMissingRelatedCount + skippedInactiveRelatedCount,
            skippedMissingRelatedCount,
            skippedInactiveRelatedCount,
          },
        };
      }
    }

    for (let index = 0; index < mutationTargets.length; index += BULK_COMBINATION_BATCH_SIZE) {
      const batch = db.batch();
      const chunk = mutationTargets.slice(index, index + BULK_COMBINATION_BATCH_SIZE);

      chunk.forEach((target) => {
        if (operation === "delete") {
          batch.delete(target.ref);
          return;
        }

        if (operation === "archive") {
          batch.update(target.ref, {
            isArchived: true,
            isActive: false,
            archivedAt: now,
            updatedAt: now,
          });
          return;
        }

        if (operation === "restore") {
          batch.update(target.ref, {
            isArchived: false,
            isActive: false,
            updatedAt: now,
          });
          return;
        }

        batch.update(target.ref, {
          isActive: false,
          updatedAt: now,
        });
      });

      await batch.commit();
    }

    const affectedTags = new Set(mutationTargets.map((target) => getCombinationCacheTag(target.region, target.pest)));
    affectedTags.forEach((tag) => updateTag(tag));
    updateTag("all-combinations");

    if (restoreSummary) {
      const resultPayload = getBulkMutationResultPayload(restoreSummary.restoredTargets, operation);

      return {
        success: true,
        data: {
          affectedCount: restoreSummary.restoredTargets.length,
          affectedKeys: resultPayload.affectedKeys,
          affectedRows: resultPayload.affectedRows,
          matchedCount: restoreSummary.matchedCount,
          restoredCount: restoreSummary.restoredTargets.length,
          restoredKeys: resultPayload.affectedKeys,
          skippedCount: restoreSummary.skippedMissingRelatedCount + restoreSummary.skippedInactiveRelatedCount,
          skippedMissingRelatedCount: restoreSummary.skippedMissingRelatedCount,
          skippedInactiveRelatedCount: restoreSummary.skippedInactiveRelatedCount,
        },
      };
    }

    return {
      success: true,
      data: {
        affectedCount: mutationTargets.length,
        ...getBulkMutationResultPayload(mutationTargets, operation),
      },
    };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to bulk mutate combinations", {
      regionSlug,
      pestSlug,
      operation,
      errorCode: errorInfo.code,
    });
    return { success: false, error: COMBINATION_ERRORS.BULK_MUTATION_FAILED };
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
  cursor: string | null = null,
  listFilter: AdminCombinationListFilter = "all"
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
      .orderBy("__name__");

    if (listFilter === "archived") {
      query = query.where("isArchived", "==", true);
    }

    query = query.limit(validPageSize + 1);

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
    console.error("Failed to fetch paginated lightweight combinations", {
      listFilter,
      errorCode: errorInfo.code,
    });
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

  const parsed = combinationSlugParamsSchema.safeParse({
    regionSlug,
    pestSlug,
  });
  if (!parsed.success) {
    return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
  }

  const { regionSlug: parsedRegion, pestSlug: parsedPest } = parsed.data;

  try {
    const docId = `${parsedRegion}_${parsedPest}`;
    const snap = await getAdminDb().collection("combinations").doc(docId).get();

    if (!snap.exists) {
      return { success: false, error: COMBINATION_ERRORS.NOT_FOUND };
    }

    const data = parseCombinationDoc(snap.data());

    const globalData = await getGlobalData();
    const regionName = globalData.regions.find(r => r.slug === parsedRegion)?.name || data.regionName;
    const pestName = globalData.pests.find(p => p.slug === parsedPest)?.name || data.pestName;

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
    console.error("Failed to fetch full admin combination", {
      regionSlug,
      pestSlug,
      errorCode: errorInfo.code,
    });
    return { success: false, error: COMBINATION_ERRORS.FETCH_FAILED };
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

  const parsed = combinationSlugParamsSchema.safeParse({
    regionSlug,
    pestSlug,
  });
  if (!parsed.success) {
    return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
  }

  const { regionSlug: parsedRegion, pestSlug: parsedPest } = parsed.data;

  try {
    const docId = `${parsedRegion}_${parsedPest}`;
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

    updateTag(getCombinationCacheTag(parsedRegion, parsedPest));
    updateTag("all-combinations");

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to archive combination", {
      regionSlug,
      pestSlug,
      errorCode: errorInfo.code,
    });
    return { success: false, error: COMBINATION_ERRORS.ARCHIVE_FAILED };
  }
};

/**
 * Restores an archived combination only when its related region and pest still exist.
 *
 * @param regionSlug - The region slug
 * @param pestSlug - The pest slug
 * @returns Success or a safe restore error
 */
export const unarchiveCombination = async (
  regionSlug: string,
  pestSlug: string
): Promise<ActionResponse<void, CombinationErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  const parsed = unarchiveCombinationSchema.safeParse({ regionSlug, pestSlug });

  if (!parsed.success) {
    return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
  }

  const { regionSlug: parsedRegion, pestSlug: parsedPest } = parsed.data;

  try {
    const db = getAdminDb();
    const docId = `${parsedRegion}_${parsedPest}`;
    const combinationRef = db.collection("combinations").doc(docId);
    const combinationSnap = await combinationRef.get();

    if (!combinationSnap.exists) {
      return { success: false, error: COMBINATION_ERRORS.NOT_FOUND };
    }

    const [pestSnap, regionSnap] = await Promise.all([
      db.collection("pests").doc(parsedPest).get(),
      db.collection("regions").doc(parsedRegion).get(),
    ]);

    if (!pestSnap.exists || !regionSnap.exists) {
      return { success: false, error: COMBINATION_ERRORS.RELATED_ENTITY_MISSING };
    }

    const data = parseCombinationDoc(combinationSnap.data());

    if (!data.isArchived) {
      return { success: true };
    }

    await combinationRef.update({
      isArchived: false,
      isActive: false,
      updatedAt: Date.now(),
    });

    updateTag(getCombinationCacheTag(parsedRegion, parsedPest));
    updateTag("all-combinations");

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to unarchive combination", {
      regionSlug,
      pestSlug,
      errorCode: errorInfo.code,
    });
    return { success: false, error: COMBINATION_ERRORS.UNARCHIVE_FAILED };
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

  const parsed = combinationSlugParamsSchema.safeParse({
    regionSlug,
    pestSlug,
  });
  if (!parsed.success) {
    return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
  }

  const { regionSlug: parsedRegion, pestSlug: parsedPest } = parsed.data;

  try {
    const docId = `${parsedRegion}_${parsedPest}`;
    const snap = await getAdminDb().collection("combinations").doc(docId).get();

    if (!snap.exists) {
      return { success: false, error: COMBINATION_ERRORS.NOT_FOUND };
    }

    return { success: true, data: parseCombinationDoc(snap.data()) };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to fetch combinations", {
      regionSlug,
      pestSlug,
      errorCode: errorInfo.code,
    });
    return { success: false, error: COMBINATION_ERRORS.FETCH_FAILED };
  }
};
