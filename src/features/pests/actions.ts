"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  buildPestPrompt,
  generateGeminiContent,
  getGeminiApiKeys,
  getGeminiModel,
} from "@/lib/gemini";
import { extractAndParseJson, parsePestDoc } from "@/utils/parsers";
import type {
  ActionResponse,
  AppImage,
  PestDoc,
  PublicMutationResult,
} from "@/types";
import {
  PEST_ERRORS,
  type PestErrorCode,
  type GeneratedContent,
} from "./types";
import {
  generatePestContentSchema,
  savePestSchema,
  updatePestSchema,
  generatedContentSchema,
  slugSchema,
} from "./schemas";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { requireAdminMutation } from "@/features/auth/requireAdminMutation";
import { activatePublishedVisibilityPatch } from "@/lib/publicActivation";
import {
  readPublishedSnapshotInTransaction,
  stagePublishedVisibilityPatch,
  type PublishedVisibilityPatchResult,
} from "@/lib/firestorePublishedSnapshot";
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

  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
  }

  try {
    const doc = await getAdminDb().collection("pests").doc(parsedSlug.data).get();
    return { success: true, data: doc.exists };
  } catch {
    console.error("Failed to check pest existence");
    return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
  }
};

/**
 * Fetches the authoritative pest document for admin edit forms.
 *
 * @param slug - Pest document slug/id to fetch
 * @returns Full parsed pest data for editing
 */
export const getPestForAdminEdit = async (
  slug: string,
): Promise<ActionResponse<PestDoc, PestErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: PEST_ERRORS.UNAUTHORIZED };
  }

  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
  }

  try {
    const doc = await getAdminDb().collection("pests").doc(parsedSlug.data).get();

    if (!doc.exists) {
      return { success: false, error: PEST_ERRORS.NOT_FOUND };
    }

    const parsed = parsePestDoc(doc.data());

    return {
      success: true,
      data: {
        ...parsed,
        slug: doc.id,
      },
    };
  } catch {
    console.error("Failed to fetch pest for admin edit", {
      slug,
    });
    return { success: false, error: PEST_ERRORS.FETCH_FAILED };
  }
};

export const generatePestContent = async (
  name: string,
  description: string,
): Promise<ActionResponse<GeneratedContent, PestErrorCode>> => {
  const guardFailure = await requireAdminMutation(
    "pest-generate-content",
    PEST_ERRORS.UNAUTHORIZED,
  );
  if (guardFailure) {
    return guardFailure;
  }

  const parsedInput = generatePestContentSchema.safeParse({
    name,
    description,
  });
  if (!parsedInput.success) {
    return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
  }

  try {
    const prompt = buildPestPrompt(parsedInput.data);
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
        const result = await generateGeminiContent(model, prompt);
        const responseText = result.response.text();

        if (!responseText) {
          return { success: false, error: PEST_ERRORS.AI_GENERATION_FAILED };
        }

        const generatedRaw = extractAndParseJson<GeneratedContent>(responseText);
        const validated = generatedContentSchema.safeParse(generatedRaw);

        if (!validated.success) {
          console.error(
            "Pest AI generation failed validation",
            { reason: "unknown_ai_error" },
          );
          return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
        }

        return { success: true, data: validated.data };
      } catch (error: unknown) {
        const errorInfo = getErrorInfo(error);
        const msg = errorInfo.message?.toLowerCase() || "";

        if (errorInfo.code === "PROVIDER_TIMEOUT") {
          console.warn("Gemini pest generation timed out", {
            keyIndex: i,
          });
          return { success: false, error: PEST_ERRORS.AI_SERVER_BUSY };
        }

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
          console.error("Pest AI generation failed", { reason: "unknown_ai_error" });
          return { success: false, error: PEST_ERRORS.AI_GENERATION_FAILED };
        }
      }
    }

    if (isQuotaError) {
      return { success: false, error: PEST_ERRORS.AI_QUOTA_EXCEEDED };
    }

    return { success: false, error: PEST_ERRORS.AI_GENERATION_FAILED };
  } catch {
    console.error("Pest AI generation failed in main try-catch", { reason: "unknown_ai_error" });
    return { success: false, error: PEST_ERRORS.AI_GENERATION_FAILED };
  }
};

export const savePest = async (
  slug: string,
  name: string,
  description: string | undefined,
  image: AppImage | undefined,
  content: GeneratedContent,
  isActive: boolean,
): Promise<ActionResponse<void, PestErrorCode>> => {
  const guardFailure = await requireAdminMutation(
    "pest-create",
    PEST_ERRORS.UNAUTHORIZED,
  );
  if (guardFailure) {
    return guardFailure;
  }

  const parsed = savePestSchema.safeParse({
    slug,
    name,
    description,
    image,
    content,
    isActive,
  });

  if (!parsed.success) {
    return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
  }

  try {
    const { slug, name, description, image, content, isActive } =
      parsed.data;

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
      .collection("pests")
      .doc(slug)
      .create(cleanDocData);

    return { success: true };
  } catch {
    console.error("Failed to save pest", {
      slug,
    });
    return { success: false, error: PEST_ERRORS.SAVE_FAILED };
  }
};

export const updatePest = async (
  slug: string,
  payload: UpdatePestInput,
): Promise<ActionResponse<void, PestErrorCode>> => {
  const guardFailure = await requireAdminMutation(
    "pest-update",
    PEST_ERRORS.UNAUTHORIZED,
  );
  if (guardFailure) {
    return guardFailure;
  }

  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
  }

  const parsed = updatePestSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
  }

  try {
    const db = getAdminDb();
    const docRef = db.collection("pests").doc(parsedSlug.data);

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
    console.error("Failed to update pest", { slug });
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 5) {
      return { success: false, error: PEST_ERRORS.NOT_FOUND };
    }
    return { success: false, error: PEST_ERRORS.UPDATE_FAILED };
  }
};

export const togglePestStatus = async (
  slug: string,
  isActive: boolean
): Promise<ActionResponse<PublicMutationResult, PestErrorCode>> => {
  const guardFailure = await requireAdminMutation(
    "pest-toggle-status",
    PEST_ERRORS.UNAUTHORIZED,
  );
  if (guardFailure) {
    return guardFailure;
  }

  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
  }

  try {
    const db = getAdminDb();
    const pestRef = db.collection("pests").doc(parsedSlug.data);
    const activeCombinationsQuery = db
      .collection("combinations")
      .where("pest", "==", parsedSlug.data)
      .where("isActive", "==", true);
    const oversizedCombinations = !isActive
      ? await activeCombinationsQuery.get()
      : null;
    if ((oversizedCombinations?.size ?? 0) > 400) {
      const mutationRefs = [
        pestRef,
        ...(oversizedCombinations?.docs.map((document) => document.ref) ?? []),
      ];
      for (let index = 0; index < mutationRefs.length; index += 400) {
        const batch = db.batch();
        mutationRefs.slice(index, index + 400).forEach((reference) => {
          batch.update(reference, { isActive: reference === pestRef ? isActive : false });
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
            pestStatuses: { [parsedSlug.data]: isActive },
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
      const pestDoc = await transaction.get(pestRef);
      if (!pestDoc.exists) return null;
      const published = await readPublishedSnapshotInTransaction(
        transaction,
        db,
      );
      const activeCombinations = !isActive
        ? await transaction.get(activeCombinationsQuery)
        : null;
      transaction.update(pestRef, { isActive });
      activeCombinations?.docs.forEach((document) => {
        transaction.update(document.ref, { isActive: false });
      });
      return stagePublishedVisibilityPatch(transaction, db, published, {
        pestStatuses: { [parsedSlug.data]: isActive },
      });
    });
    if (!transactionResult) {
      return { success: false, error: PEST_ERRORS.NOT_FOUND };
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
    console.error("Failed to toggle pest status", {
      slug,
    });
    return { success: false, error: PEST_ERRORS.TOGGLE_FAILED };
  }
};

/**
 * Deletes a pest only when no combination references it.
 *
 * @param slug - Pest document slug/id to delete
 * @returns Success or a safe dictionary-backed error code
 */
export const deletePest = async (
  slug: string,
): Promise<ActionResponse<PublicMutationResult, PestErrorCode>> => {
  const guardFailure = await requireAdminMutation(
    "pest-delete",
    PEST_ERRORS.UNAUTHORIZED,
  );
  if (guardFailure) {
    return guardFailure;
  }

  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return { success: false, error: PEST_ERRORS.VALIDATION_FAILED };
  }

  try {
    const db = getAdminDb();
    const pestRef = db.collection("pests").doc(parsedSlug.data);
    const linkedCombinationQuery = db
      .collection("combinations")
      .where("pest", "==", parsedSlug.data)
      .limit(1);
    const transactionResult = await db.runTransaction(async (transaction) => {
      const [pestDoc, linkedCombination, published] = await Promise.all([
        transaction.get(pestRef),
        transaction.get(linkedCombinationQuery),
        readPublishedSnapshotInTransaction(transaction, db),
      ]);
      if (!pestDoc.exists) return { status: "missing" as const };
      if (!linkedCombination.empty) return { status: "in-use" as const };

      transaction.delete(pestRef);
      return {
        status: "deleted" as const,
        patch: stagePublishedVisibilityPatch(transaction, db, published, {
          deletedPestSlugs: [parsedSlug.data],
        }),
      };
    });
    if (transactionResult.status === "missing") {
      return { success: false, error: PEST_ERRORS.NOT_FOUND };
    }
    if (transactionResult.status === "in-use") {
      return { success: false, error: PEST_ERRORS.PEST_IN_USE };
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
    console.error("Failed to delete pest", {
      slug,
    });
    return { success: false, error: PEST_ERRORS.DELETE_FAILED };
  }
};
