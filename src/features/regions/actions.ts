"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getGeminiModel, getGeminiApiKeys, buildRegionPrompt } from "@/lib/gemini";
import { extractAndParseJson, parseRegionDoc } from "@/utils/parsers";
import type {
  ActionResponse,
  AppImage,
  PublicMutationResult,
  RegionDoc,
} from "@/types";
import {
  REGION_ERRORS,
  type RegionErrorCode,
  type GeneratedContent,
} from "./types";
import {
  generateRegionContentSchema,
  saveRegionSchema,
  updateRegionSchema,
  generatedContentSchema,
  slugSchema,
} from "./schemas";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { activatePublishedVisibilityPatch } from "@/lib/publicActivation";
import {
  readPublishedSnapshotInTransaction,
  stagePublishedVisibilityPatch,
  type PublishedVisibilityPatchResult,
} from "@/lib/firestorePublishedSnapshot";
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

  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return { success: false, error: REGION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const doc = await getAdminDb().collection("regions").doc(parsedSlug.data).get();
    return { success: true, data: doc.exists };
  } catch {
    console.error("Failed to check region existence");
    return { success: false, error: REGION_ERRORS.VALIDATION_FAILED };
  }
};

/**
 * Fetches the authoritative region document for admin edit forms.
 *
 * @param slug - Region document slug/id to fetch
 * @returns Full parsed region data for editing
 */
export const getRegionForAdminEdit = async (
  slug: string,
): Promise<ActionResponse<RegionDoc, RegionErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: REGION_ERRORS.UNAUTHORIZED };
  }

  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return { success: false, error: REGION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const doc = await getAdminDb().collection("regions").doc(parsedSlug.data).get();

    if (!doc.exists) {
      return { success: false, error: REGION_ERRORS.NOT_FOUND };
    }

    const parsed = parseRegionDoc(doc.data());

    return {
      success: true,
      data: {
        ...parsed,
        slug: doc.id,
      },
    };
  } catch {
    console.error("Failed to fetch region for admin edit", {
      slug,
    });
    return { success: false, error: REGION_ERRORS.FETCH_FAILED };
  }
};

export const generateRegionContent = async (
  name: string,
  description: string,
): Promise<ActionResponse<GeneratedContent, RegionErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: REGION_ERRORS.UNAUTHORIZED };
  }

  const parsedInput = generateRegionContentSchema.safeParse({
    name,
    description,
  });
  if (!parsedInput.success) {
    return { success: false, error: REGION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const prompt = buildRegionPrompt(parsedInput.data);
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
            { reason: "unknown_ai_error" },
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
          console.warn("Gemini generation failed due to quota or rate limit", {
            keyIndex: i,
          });
          isQuotaError = true;
          continue; // Try next key
        } else if (msg.includes("invalid api key") || msg.includes("unauthorized") || msg.includes("api_key_invalid") || msg.includes("key invalid")) {
          console.warn("Gemini generation failed due to invalid key", {
            keyIndex: i,
          });
          continue; // Try next key
        } else if (msg.includes("503")) {
          console.warn("Gemini generation failed due to provider availability", {
            keyIndex: i,
          });
          continue; // Try next key
        } else {
          console.error("Region AI generation failed", { reason: "unknown_ai_error" });
          return { success: false, error: REGION_ERRORS.AI_GENERATION_FAILED };
        }
      }
    }

    if (isQuotaError) {
      return { success: false, error: REGION_ERRORS.AI_QUOTA_EXCEEDED };
    }

    return { success: false, error: REGION_ERRORS.AI_GENERATION_FAILED };
  } catch {
    console.error("Region AI generation failed in main try-catch", { reason: "unknown_ai_error" });
    return { success: false, error: REGION_ERRORS.AI_GENERATION_FAILED };
  }
};

export const saveRegion = async (
  slug: string,
  name: string,
  description: string | undefined,
  image: AppImage | undefined,
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
    image,
    content,
    isActive,
  });

  if (!parsed.success) {
    return { success: false, error: REGION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const { slug, name, description, image, content, isActive } = parsed.data;

    const docData = {
      name,
      slug,
      description,
      cardDescription: content.cardDescription,
      image,
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
      .collection("regions")
      .doc(slug)
      .create(cleanDocData);

    return { success: true };
  } catch {
    console.error("Failed to save region", {
      slug,
    });
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

  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return { success: false, error: REGION_ERRORS.VALIDATION_FAILED };
  }

  const parsed = updateRegionSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: REGION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const db = getAdminDb();
    const docRef = db.collection("regions").doc(parsedSlug.data);

    const { image, imageUrl, ...contentData } = parsed.data;
    const updateData = {
      ...contentData,
      ...(image === null
        ? { image: FieldValue.delete() }
        : image
          ? { image }
          : {}),
      ...(imageUrl === null
        ? { imageUrl: FieldValue.delete() }
        : typeof imageUrl === "string"
          ? { imageUrl }
          : {}),
      updatedAt: Date.now(),
    };

    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined)
    );

    await docRef.update(cleanUpdateData);

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update region", { slug });
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 5) {
      return { success: false, error: REGION_ERRORS.NOT_FOUND };
    }
    return { success: false, error: REGION_ERRORS.UPDATE_FAILED };
  }
};

export const toggleRegionStatus = async (
  slug: string,
  isActive: boolean
): Promise<ActionResponse<PublicMutationResult, RegionErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: REGION_ERRORS.UNAUTHORIZED };
  }

  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return { success: false, error: REGION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const db = getAdminDb();
    const regionRef = db.collection("regions").doc(parsedSlug.data);
    const activeCombinationsQuery = db
      .collection("combinations")
      .where("region", "==", parsedSlug.data)
      .where("isActive", "==", true);
    const oversizedCombinations = !isActive
      ? await activeCombinationsQuery.get()
      : null;
    if ((oversizedCombinations?.size ?? 0) > 400) {
      const mutationRefs = [
        regionRef,
        ...(oversizedCombinations?.docs.map((document) => document.ref) ?? []),
      ];
      for (let index = 0; index < mutationRefs.length; index += 400) {
        const batch = db.batch();
        mutationRefs.slice(index, index + 400).forEach((reference) => {
          batch.update(reference, {
            isActive: reference === regionRef ? isActive : false,
          });
        });
        await batch.commit();
      }

      let publishedPatch: PublishedVisibilityPatchResult;
      try {
        publishedPatch = await db.runTransaction(async (transaction) => {
          const published = await readPublishedSnapshotInTransaction(
            transaction,
            db,
          );
          return stagePublishedVisibilityPatch(transaction, db, published, {
            regionStatuses: { [parsedSlug.data]: isActive },
          });
        });
      } catch {
        return {
          success: true,
          data: {
            activationStatus: "deferred",
            publicationRequired: true,
          },
        };
      }
      return {
        success: true,
        data: await activatePublishedVisibilityPatch(db, publishedPatch),
      };
    }
    const transactionResult = await db.runTransaction(async (transaction) => {
      const regionDoc = await transaction.get(regionRef);
      if (!regionDoc.exists) return null;
      const published = await readPublishedSnapshotInTransaction(
        transaction,
        db,
      );
      const activeCombinations = !isActive
        ? await transaction.get(activeCombinationsQuery)
        : null;
      transaction.update(regionRef, { isActive });
      activeCombinations?.docs.forEach((document) => {
        transaction.update(document.ref, { isActive: false });
      });
      return stagePublishedVisibilityPatch(transaction, db, published, {
        regionStatuses: { [parsedSlug.data]: isActive },
      });
    });
    if (!transactionResult) {
      return { success: false, error: REGION_ERRORS.NOT_FOUND };
    }
    const activation = await activatePublishedVisibilityPatch(
      db,
      transactionResult,
    );
    return {
      success: true,
      data: activation,
    };
  } catch {
    console.error("Failed to toggle region status", {
      slug,
    });
    return { success: false, error: REGION_ERRORS.TOGGLE_FAILED };
  }
};

/**
 * Deletes a region only when no combination references it.
 *
 * @param slug - Region document slug/id to delete
 * @returns Success or a safe dictionary-backed error code
 */
export const deleteRegion = async (
  slug: string,
): Promise<ActionResponse<PublicMutationResult, RegionErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: REGION_ERRORS.UNAUTHORIZED };
  }

  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return { success: false, error: REGION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const db = getAdminDb();
    const regionRef = db.collection("regions").doc(parsedSlug.data);
    const linkedCombinationQuery = db
      .collection("combinations")
      .where("region", "==", parsedSlug.data)
      .limit(1);
    const transactionResult = await db.runTransaction(async (transaction) => {
      const [regionDoc, linkedCombination, published] = await Promise.all([
        transaction.get(regionRef),
        transaction.get(linkedCombinationQuery),
        readPublishedSnapshotInTransaction(transaction, db),
      ]);
      if (!regionDoc.exists) return { status: "missing" as const };
      if (!linkedCombination.empty) return { status: "in-use" as const };

      transaction.delete(regionRef);
      return {
        status: "deleted" as const,
        patch: stagePublishedVisibilityPatch(transaction, db, published, {
          deletedRegionSlugs: [parsedSlug.data],
        }),
      };
    });
    if (transactionResult.status === "missing") {
      return { success: false, error: REGION_ERRORS.NOT_FOUND };
    }
    if (transactionResult.status === "in-use") {
      return { success: false, error: REGION_ERRORS.REGION_IN_USE };
    }
    const activation = await activatePublishedVisibilityPatch(
      db,
      transactionResult.patch,
    );
    return {
      success: true,
      data: activation,
    };
  } catch {
    console.error("Failed to delete region", {
      slug,
    });
    return { success: false, error: REGION_ERRORS.DELETE_FAILED };
  }
};
