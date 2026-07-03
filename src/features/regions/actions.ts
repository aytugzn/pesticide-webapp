"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { updateTag } from "next/cache";
import { getGeminiModel, buildRegionPrompt } from "@/lib/gemini";
import { extractAndParseJson } from "@/utils/parsers";
import type { ActionResponse } from "@/types";
import {
  REGION_ERRORS,
  type RegionErrorCode,
  type GeneratedContent,
} from "./types";
import { generatedContentSchema, saveRegionSchema } from "./schemas";
import { requireAdmin } from "@/features/auth/requireAdmin";

export const checkRegionExists = async (slug: string): Promise<boolean> => {
  const doc = await getAdminDb().collection("regions").doc(slug).get();
  return doc.exists;
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
    const model = getGeminiModel();
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
    console.error("Region AI generation failed", error);

    const message = error instanceof Error ? error.message : "";
    if (message.includes("503")) {
      return { success: false, error: REGION_ERRORS.AI_SERVER_BUSY };
    }
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
    };

    await getAdminDb()
      .collection("regions")
      .doc(slug)
      .set(docData, { merge: true });

    updateTag("global-data");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to save region", { slug, error });
    return { success: false, error: REGION_ERRORS.SAVE_FAILED };
  }
};
