"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { getGeminiModel, getGeminiApiKeys, buildCombinationPrompt } from "@/lib/gemini";
import { parseRegionDoc, parsePestDoc, extractAndParseJson } from "@/utils/parsers";
import type { ActionResponse } from "@/types";
import { COMBINATION_ERRORS, type CombinationErrorCode, type GeneratedContent } from "../types";
import { combinationSlugParamsSchema, generatedContentSchema } from "../schemas";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { getAiErrorReason, getErrorInfo } from "./utils";

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
            reason: "unknown_ai_error"
          });
          return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
        }

        return { success: true, data: validated.data };
      } catch (error: unknown) {
        const errorInfo = getErrorInfo(error);
        const reason = getAiErrorReason(errorInfo);

        if (reason === "quota_or_rate_limit") {
          console.warn("Gemini generation failed for key due to quota or rate limit", {
            regionSlug,
            pestSlug,
            keyIndex: i,
            reason,
          });
          isQuotaError = true;
          continue; // Try next key
        } else if (reason === "invalid_api_key") {
          console.warn("Gemini generation failed for key due to invalid key", {
            regionSlug,
            pestSlug,
            keyIndex: i,
            reason,
          });
          continue; // Try next key
        } else if (reason === "provider_unavailable") {
          console.warn("Gemini generation stopped due to provider availability", {
            regionSlug,
            pestSlug,
            keyIndex: i,
            reason,
          });
          return { success: false, error: COMBINATION_ERRORS.AI_PROVIDER_UNAVAILABLE };
        } else {
          console.error("AI generation failed", { regionSlug, pestSlug, reason });
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
    const reason = getAiErrorReason(errorInfo);
    console.error("AI generation failed in main try-catch", { regionSlug, pestSlug, reason });
    if (reason === "quota_or_rate_limit") {
      return { success: false, error: COMBINATION_ERRORS.AI_QUOTA_EXCEEDED };
    }
    if (reason === "provider_unavailable") {
      return { success: false, error: COMBINATION_ERRORS.AI_PROVIDER_UNAVAILABLE };
    }
    return { success: false, error: COMBINATION_ERRORS.AI_GENERATION_FAILED };
  }
};
