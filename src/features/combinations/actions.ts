"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { getGeminiModel, buildCombinationPrompt } from "@/lib/gemini";
import { parseCombinationDoc, parseRegionDoc, parsePestDoc, extractAndParseJson } from "@/utils/parsers";
import { cacheTag, updateTag } from "next/cache";
import type { ActionResponse, CombinationDoc } from "@/types";
import { COMBINATION_ERRORS, type CombinationErrorCode, type GeneratedContent, type CombinationRow } from "./types";
import { getCombinationCacheTag } from "./constants";
import { combinationSlugParamsSchema, saveCombinationSchema, toggleCombinationSchema, generatedContentSchema } from "./schemas";


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

  try {
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

    // 2. Build prompt and call Gemini
    const prompt = buildCombinationPrompt(
      { name: region.name, description: region.description || "" },
      { name: pest.name, description: pest.description || "" }
    );

    const model = getGeminiModel();
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
    console.error("AI generation failed", { regionSlug, pestSlug, error: errorInfo });
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

    await getAdminDb().collection("combinations").doc(docId).set(docData, { merge: true });

    // Invalidate cache with read-your-writes semantics
    updateTag(getCombinationCacheTag(parsedRegionSlug, parsedPestSlug));
    updateTag("all-combinations");

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to create combination", { regionSlug, pestSlug, error: errorInfo });
    return { success: false, error: COMBINATION_ERRORS.SAVE_FAILED };
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
    await getAdminDb().collection("combinations").doc(docId).set(docData, { merge: true });

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to create combination", { regionSlug, pestSlug, error: errorInfo });
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

  try {
    const snap = await getAdminDb().collection("combinations").where("isActive", "==", true).get();

    return snap.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        region: String(data.region || ""),
        pest: String(data.pest || ""),
      };
    });
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to fetch combinations", { error: errorInfo });
    return [];
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
