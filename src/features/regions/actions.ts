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
import { getCombinationCacheTag } from "@/features/combinations/constants";

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
