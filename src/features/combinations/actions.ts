"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { getGeminiModel, buildCombinationPrompt } from "@/lib/gemini";
import { parseCombinationDoc, parseRegionDoc, parsePestDoc, extractAndParseJson } from "@/utils/parsers";
import { DICTIONARY } from "@/constants/dictionary";
import { cacheTag, updateTag } from "next/cache";
import type { ActionResponse, CombinationDoc } from "@/types";
import { COMBINATION_ERRORS, type CombinationErrorCode, type GeneratedContent, type CombinationRow } from "./types";
import { getCombinationCacheTag } from "./constants";


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
  } catch (error) {
    console.error(DICTIONARY.systemErrors.logs.fetchCombinations, { regionSlug, pestSlug, error });
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
  try {
    // 1. Fetch region and pest details from Firestore
    const [regionSnap, pestSnap] = await Promise.all([
      getAdminDb().collection("regions").doc(regionSlug).get(),
      getAdminDb().collection("pests").doc(pestSlug).get(),
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
    const generated = extractAndParseJson<GeneratedContent>(responseText);

    return { success: true, data: generated };
  } catch (error) {
    console.error(DICTIONARY.systemErrors.logs.aiGeneration, { regionSlug, pestSlug, error });
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
  try {
    const docId = `${regionSlug}_${pestSlug}`;

    const docData: CombinationDoc = {
      region: regionSlug,
      pest: pestSlug,
      regionName,
      pestName,
      title: content.title,
      h1: content.h1,
      metaDesc: content.metaDesc,
      content: content.content,
      faq: content.faq,
      isActive,
    };

    await getAdminDb().collection("combinations").doc(docId).set(docData, { merge: true });

    // Invalidate cache with read-your-writes semantics
    updateTag(getCombinationCacheTag(regionSlug, pestSlug));

    return { success: true };
  } catch (error) {
    console.error(DICTIONARY.systemErrors.logs.createCombination, { regionSlug, pestSlug, error });
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
    });

    return { success: true, data: rows };
  } catch (error) {
    console.error(DICTIONARY.systemErrors.logs.fetchCombinations, error);
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
  } catch (error) {
    console.error(DICTIONARY.systemErrors.logs.fetchCombinations, error);
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

    return { success: true };
  } catch (error) {
    console.error(DICTIONARY.systemErrors.logs.deleteCombination, { regionSlug, pestSlug, error });
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
  } catch (error) {
    console.error(DICTIONARY.systemErrors.logs.fetchCombinations, { regionSlug, pestSlug, error });
    return { success: false, error: COMBINATION_ERRORS.FETCH_FAILED };
  }
};
