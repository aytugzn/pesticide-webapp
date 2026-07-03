"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { updateTag } from "next/cache";
import { getGeminiModel, getGeminiApiKeys, buildRegionPrompt } from "@/lib/gemini";
import { extractAndParseJson } from "@/utils/parsers";
import type { ActionResponse } from "@/types";
import {
  REGION_ERRORS,
  type RegionErrorCode,
  type GeneratedContent,
} from "./types";
import { saveRegionSchema, updateRegionSchema, generatedContentSchema } from "./schemas";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { getCombinationCacheTag } from "@/features/combinations/constants";
import type { UpdateRegionInput } from "./types";

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

export const checkRegionExists = async (
  slug: string,
): Promise<ActionResponse<boolean, RegionErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: REGION_ERRORS.UNAUTHORIZED };
  }

  try {
    const doc = await getAdminDb().collection("regions").doc(slug).get();
    return { success: true, data: doc.exists };
  } catch (error) {
    console.error("Failed to check region existence", error);
    return { success: false, error: REGION_ERRORS.VALIDATION_FAILED };
  }
};

export const generateRegionContent = async (
  name: string,
  description: string,
): Promise<ActionResponse<GeneratedContent, RegionErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: REGION_ERRORS.UNAUTHORIZED };
  }

  try {
    const prompt = buildRegionPrompt({ name, description });
    const keys = getGeminiApiKeys();

    if (keys.length === 0) {
      console.error("No Gemini API keys found");
      return { success: false, error: REGION_ERRORS.AI_GENERATION_FAILED };
    }

    let isQuotaError = false;

    for (let i = 0; i < keys.length; i++) {
      const apiKey = keys[i];
      try {
        const model = getGeminiModel(apiKey);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (!responseText) {
          return { success: false, error: REGION_ERRORS.AI_GENERATION_FAILED };
        }

        const generatedRaw = extractAndParseJson<GeneratedContent>(responseText);
        const validated = generatedContentSchema.safeParse(generatedRaw);

        if (!validated.success) {
          console.error(
            "Region AI generation failed validation",
            validated.error.message,
          );
          return { success: false, error: REGION_ERRORS.VALIDATION_FAILED };
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
        } else if (msg.includes("503")) {
          console.warn(`Gemini generation failed with key index ${i} due to 503`);
          continue; // Try next key
        } else {
          console.error("Region AI generation failed", { error: errorInfo });
          return { success: false, error: REGION_ERRORS.AI_GENERATION_FAILED };
        }
      }
    }

    if (isQuotaError) {
      return { success: false, error: REGION_ERRORS.AI_QUOTA_EXCEEDED };
    }

    return { success: false, error: REGION_ERRORS.AI_GENERATION_FAILED };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Region AI generation failed in main try-catch", { error: errorInfo });
    return { success: false, error: REGION_ERRORS.AI_GENERATION_FAILED };
  }
};

export const saveRegion = async (
  slug: string,
  name: string,
  description: string | undefined,
  content: GeneratedContent,
  isActive: boolean,
): Promise<ActionResponse<void, RegionErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: REGION_ERRORS.UNAUTHORIZED };
  }

  const parsed = saveRegionSchema.safeParse({
    slug,
    name,
    description,
    content,
    isActive,
  });

  if (!parsed.success) {
    return { success: false, error: REGION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const { slug, name, description, content, isActive } = parsed.data;

    const docData = {
      name,
      slug,
      description,
      title: content.title,
      h1: content.h1,
      metaDesc: content.metaDesc,
      content: content.content,
      faq: content.faq,
      isActive,
      createdAt: Date.now(),
    };

    await getAdminDb()
      .collection("regions")
      .doc(slug)
      .create(docData);

    updateTag("global-data");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to save region", { slug, error });
    return { success: false, error: REGION_ERRORS.SAVE_FAILED };
  }
};

export const updateRegion = async (
  slug: string,
  payload: UpdateRegionInput,
): Promise<ActionResponse<void, RegionErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: REGION_ERRORS.UNAUTHORIZED };
  }

  const parsed = updateRegionSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: REGION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const db = getAdminDb();
    const docRef = db.collection("regions").doc(slug);

    await docRef.update({
      ...parsed.data,
      updatedAt: Date.now(),
    });

    updateTag("global-data");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update region", { slug, error: error instanceof Error ? error.message : String(error) });
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 5) {
      return { success: false, error: REGION_ERRORS.NOT_FOUND };
    }
    return { success: false, error: REGION_ERRORS.UPDATE_FAILED };
  }
};

export const toggleRegionStatus = async (
  slug: string,
  isActive: boolean
): Promise<ActionResponse<void, RegionErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: REGION_ERRORS.UNAUTHORIZED };
  }

  try {
    const db = getAdminDb();
    const regionRef = db.collection("regions").doc(slug);

    const regionDoc = await regionRef.get(); if (!regionDoc.exists) {
      return { success: false, error: REGION_ERRORS.NOT_FOUND };
    }

    const batch = db.batch();
    batch.update(regionRef, { isActive });

    const updatedCombinationTags: string[] = [];

    if (!isActive) {
      const activeCombinationsQuery = await db
        .collection("combinations")
        .where("region", "==", slug)
        .where("isActive", "==", true)
        .get();

      activeCombinationsQuery.docs.forEach((doc) => {
        batch.update(doc.ref, { isActive: false });
        const data = doc.data();
        updatedCombinationTags.push(getCombinationCacheTag(data.region, data.pest));
      });
    }

    await batch.commit();

    updateTag("global-data");
    if (!isActive && updatedCombinationTags.length > 0) {
      updateTag("all-combinations");
      updatedCombinationTags.forEach((tag) => updateTag(tag));
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to toggle region status", { slug, error });
    return { success: false, error: REGION_ERRORS.TOGGLE_FAILED };
  }
};
