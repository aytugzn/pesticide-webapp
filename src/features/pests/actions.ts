"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { updateTag } from "next/cache";
import { getGeminiModel, getGeminiApiKeys, buildPestPrompt } from "@/lib/gemini";
import { extractAndParseJson } from "@/utils/parsers";
import type { ActionResponse } from "@/types";
import {
  PEST_ERRORS,
  type PestErrorCode,
  type GeneratedContent,
} from "./types";
import { savePestSchema, updatePestSchema, generatedContentSchema } from "./schemas";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { getCombinationCacheTag } from "@/features/combinations/constants";
import type { UpdatePestInput } from "./types";

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

export const checkPestExists = async (
  slug: string,
): Promise<ActionResponse<boolean, PestErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: PEST_ERRORS.UNAUTHORIZED };
  }

  try {
    const doc = await getAdminDb().collection("pests").doc(slug).get();
    return { success: true, data: doc.exists };
  } catch (error: unknown) {
    console.error("Failed to check pest existence", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
  }
};

export const generatePestContent = async (
  name: string,
  description: string,
): Promise<ActionResponse<GeneratedContent, PestErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: PEST_ERRORS.UNAUTHORIZED };
  }

  try {
    const prompt = buildPestPrompt({ name, description });
    const keys = getGeminiApiKeys();

    if (keys.length === 0) {
      console.error("No Gemini API keys found");
      return { success: false, error: PEST_ERRORS.AI_GENERATION_FAILED };
    }

    let isQuotaError = false;

    for (let i = 0; i < keys.length; i++) {
      const apiKey = keys[i];
      try {
        const model = getGeminiModel(apiKey);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (!responseText) {
          return { success: false, error: PEST_ERRORS.AI_GENERATION_FAILED };
        }

        const generatedRaw = extractAndParseJson<GeneratedContent>(responseText);
        const validated = generatedContentSchema.safeParse(generatedRaw);

        if (!validated.success) {
          console.error(
            "Pest AI generation failed validation",
            validated.error.message,
          );
          return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
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
          console.error("Pest AI generation failed", { error: errorInfo });
          return { success: false, error: PEST_ERRORS.AI_GENERATION_FAILED };
        }
      }
    }

    if (isQuotaError) {
      return { success: false, error: PEST_ERRORS.AI_QUOTA_EXCEEDED };
    }

    return { success: false, error: PEST_ERRORS.AI_GENERATION_FAILED };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Pest AI generation failed in main try-catch", { error: errorInfo });
    return { success: false, error: PEST_ERRORS.AI_GENERATION_FAILED };
  }
};

export const savePest = async (
  slug: string,
  name: string,
  description: string | undefined,
  imageUrl: string | undefined,
  content: GeneratedContent,
  isActive: boolean,
): Promise<ActionResponse<void, PestErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: PEST_ERRORS.UNAUTHORIZED };
  }

  const parsed = savePestSchema.safeParse({
    slug,
    name,
    description,
    imageUrl,
    content,
    isActive,
  });

  if (!parsed.success) {
    return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
  }

  try {
    const { slug, name, description, imageUrl, content, isActive } =
      parsed.data;

    const docData = {
      name,
      slug,
      description,
      imageUrl,
      title: content.title,
      h1: content.h1,
      metaDesc: content.metaDesc,
      content: content.content,
      faq: content.faq,
      isActive,
      createdAt: Date.now(),
    };

    const cleanDocData = Object.fromEntries(
      Object.entries(docData).filter(([, v]) => v !== undefined)
    );

    await getAdminDb()
      .collection("pests")
      .doc(slug)
      .create(cleanDocData);

    updateTag("global-data");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to save pest", {
      slug,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return { success: false, error: PEST_ERRORS.SAVE_FAILED };
  }
};

export const updatePest = async (
  slug: string,
  payload: UpdatePestInput,
): Promise<ActionResponse<void, PestErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: PEST_ERRORS.UNAUTHORIZED };
  }

  const parsed = updatePestSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
  }

  try {
    const db = getAdminDb();
    const docRef = db.collection("pests").doc(slug);

    const updateData = {
      ...parsed.data,
      updatedAt: Date.now(),
    };

    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined)
    );

    await docRef.update(cleanUpdateData);

    updateTag("global-data");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update pest", { slug, error: error instanceof Error ? error.message : String(error) });
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 5) {
      return { success: false, error: PEST_ERRORS.NOT_FOUND };
    }
    return { success: false, error: PEST_ERRORS.UPDATE_FAILED };
  }
};

export const togglePestStatus = async (
  slug: string,
  isActive: boolean
): Promise<ActionResponse<void, PestErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: PEST_ERRORS.UNAUTHORIZED };
  }

  try {
    const db = getAdminDb();
    const pestRef = db.collection("pests").doc(slug);

    const pestDoc = await pestRef.get(); if (!pestDoc.exists) {
      return { success: false, error: PEST_ERRORS.NOT_FOUND };
    }

    const MAX_BATCH_SIZE = 450;
    const batches: FirebaseFirestore.WriteBatch[] = [];
    let currentBatch = db.batch();
    let currentBatchSize = 0;

    const addToBatch = (operation: (b: FirebaseFirestore.WriteBatch) => void) => {
      if (currentBatchSize >= MAX_BATCH_SIZE) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        currentBatchSize = 0;
      }
      operation(currentBatch);
      currentBatchSize++;
    };

    addToBatch((b) => b.update(pestRef, { isActive }));

    const updatedCombinationTags: string[] = [];

    if (!isActive) {
      const activeCombinationsQuery = await db
        .collection("combinations")
        .where("pest", "==", slug)
        .where("isActive", "==", true)
        .get();

      activeCombinationsQuery.docs.forEach((doc) => {
        addToBatch((b) => b.update(doc.ref, { isActive: false }));
        const data = doc.data();
        updatedCombinationTags.push(getCombinationCacheTag(data.region, data.pest));
      });
    }

    if (currentBatchSize > 0) {
      batches.push(currentBatch);
    }

    for (const b of batches) {
      await b.commit();
    }

    updateTag("global-data");
    if (!isActive && updatedCombinationTags.length > 0) {
      updateTag("all-combinations");
      updatedCombinationTags.forEach((tag) => updateTag(tag));
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to toggle pest status", {
      slug,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return { success: false, error: PEST_ERRORS.TOGGLE_FAILED };
  }
};
