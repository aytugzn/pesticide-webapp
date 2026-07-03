"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { updateTag } from "next/cache";
import { getGeminiModel, buildPestPrompt } from "@/lib/gemini";
import { extractAndParseJson } from "@/utils/parsers";
import type { ActionResponse } from "@/types";
import {
  PEST_ERRORS,
  type PestErrorCode,
  type GeneratedContent,
} from "./types";
import { generatedContentSchema, savePestSchema } from "./schemas";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { getCombinationCacheTag } from "@/features/combinations/constants";

export const checkPestExists = async (slug: string): Promise<boolean> => {
  const doc = await getAdminDb().collection("pests").doc(slug).get();
  return doc.exists;
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
    const model = getGeminiModel();
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
    console.error("Pest AI generation failed", error);

    const message = error instanceof Error ? error.message : "";

    if (message.includes("503")) {
      return { success: false, error: PEST_ERRORS.AI_SERVER_BUSY };
    }
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
    };

    await getAdminDb()
      .collection("pests")
      .doc(slug)
      .set(docData, { merge: true });

    updateTag("global-data");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to save pest", { slug, error });
    return { success: false, error: PEST_ERRORS.SAVE_FAILED };
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

    const batch = db.batch();
    batch.update(pestRef, { isActive });

    const updatedCombinationTags: string[] = [];

    if (!isActive) {
      const activeCombinationsQuery = await db
        .collection("combinations")
        .where("pest", "==", slug)
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
    console.error("Failed to toggle pest status", { slug, error });
    return { success: false, error: PEST_ERRORS.TOGGLE_FAILED };
  }
};
