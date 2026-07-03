"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { randomUUID } from "node:crypto";
import { getGeminiModel, getGeminiApiKeys, buildCombinationPrompt } from "@/lib/gemini";
import { parseCombinationDoc, parseRegionDoc, parsePestDoc, extractAndParseJson } from "@/utils/parsers";
import { cacheTag, updateTag } from "next/cache";
import type { ActionResponse, CombinationDoc } from "@/types";
import { COMBINATION_ERRORS, COMBINATION_JOB_ERRORS, type CombinationErrorCode, type CombinationJobErrorCode, type GeneratedContent, type CombinationRow, type CombinationBulkJobDoc, type BulkProgressItem } from "./types";
import { getCombinationCacheTag } from "./constants";
import { combinationSlugParamsSchema, saveCombinationSchema, toggleCombinationSchema, generatedContentSchema, updateCombinationSchema } from "./schemas";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { getGlobalData } from "@/features/settings/actions";


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
    if (!data.isActive) return null;

    return data;
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to fetch combinations", { regionSlug, pestSlug, error: errorInfo });
    return null;
  }
};

/**
 * Generates SEO content for a region-pest combination using Gemini AI.
 * Fetches the region/pest descriptions from Firestore, builds the prompt,
 * and parses the structured JSON response.
 *
 * @param regionSlug - The region slug
 * @param pestSlug - The pest slug
 * @returns Generated content or error
 */
export const generateCombinationContent = async (
  regionSlug: string,
  pestSlug: string
): Promise<ActionResponse<GeneratedContent, CombinationErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  const params = combinationSlugParamsSchema.safeParse({ regionSlug, pestSlug });

  if (!params.success) {
    return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
  }

  try {
    // 1. Fetch region and pest details from Firestore
    const [regionSnap, pestSnap] = await Promise.all([
      getAdminDb().collection("regions").doc(params.data.regionSlug).get(),
      getAdminDb().collection("pests").doc(params.data.pestSlug).get(),
    ]);

    if (!regionSnap.exists) {
      return { success: false, error: COMBINATION_ERRORS.REGION_NOT_FOUND };
    }
    if (!pestSnap.exists) {
      return { success: false, error: COMBINATION_ERRORS.PEST_NOT_FOUND };
    }

    const region = parseRegionDoc(regionSnap.data());
    const pest = parsePestDoc(pestSnap.data());

    // 2. Build prompt
    const prompt = buildCombinationPrompt(
      { name: region.name, description: region.description || "" },
      { name: pest.name, description: pest.description || "" }
    );

    const keys = getGeminiApiKeys();
    if (keys.length === 0) {
      console.error("No Gemini API keys found");
      return { success: false, error: COMBINATION_ERRORS.AI_GENERATION_FAILED };
    }

    let isQuotaError = false;

    for (let i = 0; i < keys.length; i++) {
      const apiKey = keys[i];
      try {
        const model = getGeminiModel(apiKey);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (!responseText) {
          return { success: false, error: COMBINATION_ERRORS.AI_GENERATION_FAILED };
        }

        // 3. Parse AI response using the safe JSON extractor
        const generatedRaw = extractAndParseJson<GeneratedContent>(responseText);

        const validated = generatedContentSchema.safeParse(generatedRaw);
        if (!validated.success) {
          console.error("AI generation failed", {
            regionSlug,
            pestSlug,
            error: "Generated content validation failed: " + validated.error.message
          });
          return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
        }

        return { success: true, data: validated.data };
      } catch (error: unknown) {
        const errorInfo = getErrorInfo(error);
        const msg = errorInfo.message?.toLowerCase() || "";

        if (
          msg.includes("429") ||
          msg.includes("quota exceeded") ||
          msg.includes("too many requests") ||
          msg.includes("generate_content_free_tier_requests") ||
          msg.includes("limit:")
        ) {
          console.warn(`Gemini generation failed with key index ${i} due to quota/rate limit`);
          isQuotaError = true;
          continue; // Try next key
        } else if (msg.includes("invalid api key") || msg.includes("unauthorized") || msg.includes("api_key_invalid") || msg.includes("key invalid")) {
          console.warn(`Gemini generation failed with key index ${i} due to invalid key/auth`);
          continue; // Try next key
        } else {
          console.error("AI generation failed", { regionSlug, pestSlug, error: errorInfo });
          return { success: false, error: COMBINATION_ERRORS.AI_GENERATION_FAILED };
        }
      }
    }

    if (isQuotaError) {
      return { success: false, error: COMBINATION_ERRORS.AI_QUOTA_EXCEEDED };
    }

    return { success: false, error: COMBINATION_ERRORS.AI_GENERATION_FAILED };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("AI generation failed in main try-catch", { regionSlug, pestSlug, error: errorInfo });
    return { success: false, error: COMBINATION_ERRORS.AI_GENERATION_FAILED };
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
 * Saves a combination to Firestore WITHOUT invalidating any cache tags.
 * Intended for bulk generation flows. Saves the combination as a draft
 * without triggering public cache invalidation.
 *
 * @param regionSlug - The region slug
 * @param pestSlug - The pest slug
 * @param regionName - Display name for the region
 * @param pestName - Display name for the pest
 * @param content - The generated content fields
 * @returns Success or error
 */
export const saveCombinationSilently = async (
  regionSlug: string,
  pestSlug: string,
  regionName: string,
  pestName: string,
  content: GeneratedContent
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
    isActive: false,
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
      isActive: false,
    };

    // Intentionally no updateTag here since the combination is saved as a draft.
    const docRef = getAdminDb().collection("combinations").doc(docId);
    await docRef.create(docData);

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

const getErrorInfo = (
  error: unknown,
): { code?: string; message?: string } => {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { code?: unknown; message?: unknown };

    return {
      code: typeof candidate.code === "string"
        ? candidate.code
        : typeof candidate.code === "number"
          ? String(candidate.code)
          : undefined,
      message: typeof candidate.message === "string"
        ? candidate.message
        : error instanceof Error
          ? error.message
          : undefined,
    };
  }

  return {};
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
 * Fetches all combinations for the admin table view.
 * Enriches each row with region/pest display names.
 *
 * @returns Array of CombinationRow objects
 */
export const getAdminCombinations = async (): Promise<ActionResponse<CombinationRow[], CombinationErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  try {
    const [combSnap, regionsSnap, pestsSnap] = await Promise.all([
      getAdminDb().collection("combinations").get(),
      getAdminDb().collection("regions").get(),
      getAdminDb().collection("pests").get(),
    ]);

    // Build lookup maps for display names
    const regionMap = new Map<string, string>();
    regionsSnap.docs.forEach((doc) => {
      const d = parseRegionDoc(doc.data());
      regionMap.set(d.slug, d.name);
    });

    const pestMap = new Map<string, string>();
    pestsSnap.docs.forEach((doc) => {
      const d = parsePestDoc(doc.data());
      pestMap.set(d.slug, d.name);
    });

    const rows: CombinationRow[] = combSnap.docs.map((doc) => {
      const data = parseCombinationDoc(doc.data());
      return {
        id: doc.id,
        ...data,
        regionName: data.regionName || regionMap.get(data.region) || data.region,
        pestName: data.pestName || pestMap.get(data.pest) || data.pest,
      };
    }).sort((a, b) => a.id.localeCompare(b.id));

    return { success: true, data: rows };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to fetch combinations", { error: errorInfo });
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
 * Deletes a combination from Firestore and invalidates the relevant cache tag.
 *
 * @param regionSlug - The region slug
 * @param pestSlug - The pest slug
 * @returns Success or error
 */
export const deleteCombination = async (
  regionSlug: string,
  pestSlug: string
): Promise<ActionResponse<void, CombinationErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  try {
    const docId = `${regionSlug}_${pestSlug}`;
    await getAdminDb().collection("combinations").doc(docId).delete();

    updateTag(getCombinationCacheTag(regionSlug, pestSlug));
    updateTag("all-combinations");

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to delete combination", { regionSlug, pestSlug, error: errorInfo });
    return { success: false, error: COMBINATION_ERRORS.DELETE_FAILED };
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

const JOB_DOC_PATH = "adminJobs/bulkCombinationGeneration";
const JOB_STALE_TIMEOUT_MS = 120_000;

export const getActiveCombinationJob = async (): Promise<ActionResponse<CombinationBulkJobDoc | null, CombinationJobErrorCode>> => {
  if (!(await requireAdmin())) return { success: false, error: COMBINATION_JOB_ERRORS.UNAUTHORIZED };

  try {
    const snap = await getAdminDb().doc(JOB_DOC_PATH).get();
    if (!snap.exists) return { success: true, data: null };

    const data = snap.data() as CombinationBulkJobDoc;
    const now = Date.now();

    // Cleanup stale job if running but heartbeat is too old
    if (data.status === "running") {
      const isStale = now - data.heartbeatAt > JOB_STALE_TIMEOUT_MS;
      if (isStale) {
        const finalStatus = data.abortRequested ? "aborted" : "stale";

        await getAdminDb().runTransaction(async (transaction) => {
          const tSnap = await transaction.get(getAdminDb().doc(JOB_DOC_PATH));
          if (!tSnap.exists) return;
          const tData = tSnap.data() as CombinationBulkJobDoc;
          if (tData.id === data.id && tData.status === "running") {
            transaction.update(getAdminDb().doc(JOB_DOC_PATH), {
              status: finalStatus,
              updatedAt: now,
            });
          }
        });

        // Return the updated data to the client immediately
        return { success: true, data: { ...data, status: finalStatus, updatedAt: now } };
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch active combination job", { error: getErrorInfo(error) });
    return { success: false, error: COMBINATION_JOB_ERRORS.UNKNOWN_ERROR };
  }
};

export const startCombinationJob = async (items: BulkProgressItem[]): Promise<ActionResponse<CombinationBulkJobDoc, CombinationJobErrorCode>> => {
  if (!(await requireAdmin())) return { success: false, error: COMBINATION_JOB_ERRORS.UNAUTHORIZED };

  try {
    const docRef = getAdminDb().doc(JOB_DOC_PATH);

    const newJob = await getAdminDb().runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      const now = Date.now();

      if (snap.exists) {
        const data = snap.data() as CombinationBulkJobDoc;
        if (data.status === "running") {
          const isStale = now - data.heartbeatAt > JOB_STALE_TIMEOUT_MS;
          if (!isStale) {
             throw new Error(COMBINATION_JOB_ERRORS.ALREADY_RUNNING);
          }
        }
      }

      const jobId = randomUUID();
      const newDoc: CombinationBulkJobDoc = {
        id: jobId,
        type: "bulkCombinationGeneration",
        status: "running",
        createdAt: now,
        updatedAt: now,
        heartbeatAt: now,
        total: items.length,
        doneCount: 0,
        errorCount: 0,
        abortRequested: false,
        items,
      };

      transaction.set(docRef, newDoc);
      return newDoc;
    });

    return { success: true, data: newJob };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    if (errorInfo.message === COMBINATION_JOB_ERRORS.ALREADY_RUNNING) {
      return { success: false, error: COMBINATION_JOB_ERRORS.ALREADY_RUNNING };
    }
    console.error("Failed to start combination job", { error: errorInfo });
    return { success: false, error: COMBINATION_JOB_ERRORS.UNKNOWN_ERROR };
  }
};

export const updateCombinationJobItem = async (
  jobId: string,
  index: number,
  patch: Partial<BulkProgressItem>
): Promise<ActionResponse<{ abortRequested: boolean }, CombinationJobErrorCode>> => {
  if (!(await requireAdmin())) return { success: false, error: COMBINATION_JOB_ERRORS.UNAUTHORIZED };

  try {
    const docRef = getAdminDb().doc(JOB_DOC_PATH);
    const result = await getAdminDb().runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) throw new Error(COMBINATION_JOB_ERRORS.NOT_FOUND);

      const data = snap.data() as CombinationBulkJobDoc;
      if (data.id !== jobId) throw new Error(COMBINATION_JOB_ERRORS.NOT_FOUND);
      if (data.status !== "running") throw new Error(COMBINATION_JOB_ERRORS.INVALID_JOB_STATE);

      const updatedItems = [...data.items];
      updatedItems[index] = { ...updatedItems[index], ...patch };

      const doneCount = updatedItems.filter(i => i.status === "done").length;
      const errorCount = updatedItems.filter(i => i.status === "error").length;
      const now = Date.now();

      transaction.update(docRef, {
        items: updatedItems,
        doneCount,
        errorCount,
        updatedAt: now,
        heartbeatAt: now,
      });

      return { abortRequested: data.abortRequested };
    });

    return { success: true, data: result };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    if (errorInfo.message === COMBINATION_JOB_ERRORS.NOT_FOUND) return { success: false, error: COMBINATION_JOB_ERRORS.NOT_FOUND };
    if (errorInfo.message === COMBINATION_JOB_ERRORS.INVALID_JOB_STATE) return { success: false, error: COMBINATION_JOB_ERRORS.INVALID_JOB_STATE };

    console.error("Failed to update combination job item", { jobId, index, patch, error: errorInfo });
    return { success: false, error: COMBINATION_JOB_ERRORS.UNKNOWN_ERROR };
  }
};

export const requestAbortCombinationJob = async (jobId: string): Promise<ActionResponse<void, CombinationJobErrorCode>> => {
  if (!(await requireAdmin())) return { success: false, error: COMBINATION_JOB_ERRORS.UNAUTHORIZED };

  try {
    const docRef = getAdminDb().doc(JOB_DOC_PATH);
    await getAdminDb().runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) throw new Error(COMBINATION_JOB_ERRORS.NOT_FOUND);

      const data = snap.data() as CombinationBulkJobDoc;
      if (data.id !== jobId) throw new Error(COMBINATION_JOB_ERRORS.NOT_FOUND);
      if (data.status !== "running") throw new Error(COMBINATION_JOB_ERRORS.INVALID_JOB_STATE);

      transaction.update(docRef, {
        abortRequested: true,
        updatedAt: Date.now(),
      });
    });

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    if (errorInfo.message === COMBINATION_JOB_ERRORS.NOT_FOUND) return { success: false, error: COMBINATION_JOB_ERRORS.NOT_FOUND };
    if (errorInfo.message === COMBINATION_JOB_ERRORS.INVALID_JOB_STATE) return { success: false, error: COMBINATION_JOB_ERRORS.INVALID_JOB_STATE };

    console.error("Failed to request abort for combination job", { jobId, error: errorInfo });
    return { success: false, error: COMBINATION_JOB_ERRORS.UNKNOWN_ERROR };
  }
};

export const finishCombinationJob = async (
  jobId: string,
  status: "completed" | "aborted" | "failed"
): Promise<ActionResponse<void, CombinationJobErrorCode>> => {
  if (!(await requireAdmin())) return { success: false, error: COMBINATION_JOB_ERRORS.UNAUTHORIZED };

  try {
    const docRef = getAdminDb().doc(JOB_DOC_PATH);
    await getAdminDb().runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) throw new Error(COMBINATION_JOB_ERRORS.NOT_FOUND);

      const data = snap.data() as CombinationBulkJobDoc;
      if (data.id !== jobId) throw new Error(COMBINATION_JOB_ERRORS.NOT_FOUND);
      if (data.status !== "running") throw new Error(COMBINATION_JOB_ERRORS.INVALID_JOB_STATE);

      const now = Date.now();
      transaction.update(docRef, {
        status,
        updatedAt: now,
        heartbeatAt: now,
      });
    });

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    if (errorInfo.message === COMBINATION_JOB_ERRORS.NOT_FOUND) return { success: false, error: COMBINATION_JOB_ERRORS.NOT_FOUND };
    if (errorInfo.message === COMBINATION_JOB_ERRORS.INVALID_JOB_STATE) return { success: false, error: COMBINATION_JOB_ERRORS.INVALID_JOB_STATE };

    console.error("Failed to finish combination job", { jobId, status, error: errorInfo });
    return { success: false, error: COMBINATION_JOB_ERRORS.UNKNOWN_ERROR };
  }
};
