"use server";

import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { randomUUID } from "node:crypto";
import type { ActionResponse, CombinationDoc } from "@/types";
import { 
  COMBINATION_ERRORS, 
  COMBINATION_JOB_ERRORS, 
  type CombinationErrorCode, 
  type CombinationJobErrorCode, 
  type GeneratedContent, 
  type CombinationBulkJobDoc, 
  type BulkProgressItem 
} from "../types";
import { saveCombinationSchema } from "../schemas";
import { AppError } from "@/lib/exceptions";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { getErrorInfo } from "./utils";

const JOB_DOC_PATH = "adminJobs/bulkCombinationGeneration";
const JOB_STALE_TIMEOUT_MS = 120_000;

/**
 * Saves a bulk-generated combination to Firestore as an active public page
 * without publishing cached public content.
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
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  const parsed = saveCombinationSchema.safeParse({
    regionSlug,
    pestSlug,
    regionName,
    pestName,
    content,
    isActive: true,
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

    const docRef = getAdminDb().collection("combinations").doc(docId);
    const existingSnap = await docRef.get();

    if (existingSnap.exists) {
      const existingData = existingSnap.data() as Record<string, unknown> | undefined;
      return {
        success: false,
        error: existingData?.isArchived === true
          ? COMBINATION_ERRORS.ARCHIVED_EXISTS
          : COMBINATION_ERRORS.ALREADY_EXISTS,
      };
    }

    await docRef.create(docData);

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to create combination", { regionSlug, pestSlug, error: errorInfo });

    if (errorInfo.code === "6" || errorInfo.message?.includes("ALREADY_EXISTS")) {
      try {
        const docId = `${regionSlug}_${pestSlug}`;
        const existingSnap = await getAdminDb().collection("combinations").doc(docId).get();
        const existingData = existingSnap.data() as Record<string, unknown> | undefined;
        if (existingSnap.exists && existingData?.isArchived === true) {
          return { success: false, error: COMBINATION_ERRORS.ARCHIVED_EXISTS };
        }
      } catch (lookupError: unknown) {
        console.error("Failed to inspect existing combination after duplicate silent create", {
          regionSlug,
          pestSlug,
          error: getErrorInfo(lookupError),
        });
      }

      return { success: false, error: COMBINATION_ERRORS.ALREADY_EXISTS };
    }

    return { success: false, error: COMBINATION_ERRORS.SAVE_FAILED };
  }
};

/**
 * Fetches lightweight existing combination keys for bulk generation missing calculation.
 * Decoupled from table rows to allow independent pagination in the future.
 *
 * @returns Array of string keys in the format "regionSlug_pestSlug"
 */
export const getExistingCombinationKeys = async (): Promise<ActionResponse<string[], CombinationErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  try {
    const snap = await getAdminDb()
      .collection("combinations")
      .select("region", "pest")
      .get();

    const keys: string[] = snap.docs.map(doc => {
      const data = doc.data();
      return `${data.region}_${data.pest}`;
    });

    return { success: true, data: keys };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Failed to fetch existing combination keys", { error: errorInfo });
    return { success: false, error: COMBINATION_ERRORS.FETCH_FAILED };
  }
};

export const getActiveCombinationJob = async (): Promise<ActionResponse<CombinationBulkJobDoc | null, CombinationJobErrorCode>> => {
  if (!(await requireAdmin())) return { success: false, error: COMBINATION_JOB_ERRORS.UNAUTHORIZED };

  try {
    const snap = await getAdminDb().doc(JOB_DOC_PATH).get();
    if (!snap.exists) return { success: true, data: null };

    const data = snap.data() as CombinationBulkJobDoc;
    const now = Date.now();

    // Cleanup stale job if running but heartbeat is too old
    if (data.status === "running") {
      const isStale = now - data.heartbeatAt > JOB_STALE_TIMEOUT_MS;
      if (isStale) {
        const finalStatus = data.abortRequested ? "aborted" : "stale";

        await getAdminDb().runTransaction(async (transaction) => {
          const tSnap = await transaction.get(getAdminDb().doc(JOB_DOC_PATH));
          if (!tSnap.exists) return;
          const tData = tSnap.data() as CombinationBulkJobDoc;
          if (tData.id === data.id && tData.status === "running") {
            transaction.update(getAdminDb().doc(JOB_DOC_PATH), {
              status: finalStatus,
              updatedAt: now,
            });
          }
        });

        // Return the updated data to the client immediately
        return { success: true, data: { ...data, status: finalStatus, updatedAt: now } };
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch active combination job", { error: getErrorInfo(error) });
    return { success: false, error: COMBINATION_JOB_ERRORS.UNKNOWN_ERROR };
  }
};

export const startCombinationJob = async (items: BulkProgressItem[]): Promise<ActionResponse<CombinationBulkJobDoc, CombinationJobErrorCode>> => {
  if (!(await requireAdmin())) return { success: false, error: COMBINATION_JOB_ERRORS.UNAUTHORIZED };

  try {
    const docRef = getAdminDb().doc(JOB_DOC_PATH);

    const newJob = await getAdminDb().runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      const now = Date.now();

      if (snap.exists) {
        const data = snap.data() as CombinationBulkJobDoc;
        if (data.status === "running") {
          const isStale = now - data.heartbeatAt > JOB_STALE_TIMEOUT_MS;
          if (!isStale) {
             throw new AppError(COMBINATION_JOB_ERRORS.ALREADY_RUNNING, COMBINATION_JOB_ERRORS.ALREADY_RUNNING);
          }
        }
      }

      const jobId = randomUUID();
      const newDoc: CombinationBulkJobDoc = {
        id: jobId,
        type: "bulkCombinationGeneration",
        status: "running",
        createdAt: now,
        updatedAt: now,
        heartbeatAt: now,
        total: items.length,
        doneCount: 0,
        errorCount: 0,
        abortRequested: false,
        items,
      };

      transaction.set(docRef, newDoc);
      return newDoc;
    });

    return { success: true, data: newJob };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    if (errorInfo.code === COMBINATION_JOB_ERRORS.ALREADY_RUNNING || errorInfo.message === COMBINATION_JOB_ERRORS.ALREADY_RUNNING) {
      return { success: false, error: COMBINATION_JOB_ERRORS.ALREADY_RUNNING };
    }
    console.error("Failed to start combination job", { error: errorInfo });
    return { success: false, error: COMBINATION_JOB_ERRORS.UNKNOWN_ERROR };
  }
};

export const updateCombinationJobItem = async (
  jobId: string,
  index: number,
  patch: Partial<BulkProgressItem>
): Promise<ActionResponse<{ abortRequested: boolean }, CombinationJobErrorCode>> => {
  if (!(await requireAdmin())) return { success: false, error: COMBINATION_JOB_ERRORS.UNAUTHORIZED };

  try {
    const docRef = getAdminDb().doc(JOB_DOC_PATH);
    const result = await getAdminDb().runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) throw new AppError(COMBINATION_JOB_ERRORS.NOT_FOUND, COMBINATION_JOB_ERRORS.NOT_FOUND);

      const data = snap.data() as CombinationBulkJobDoc;
      if (data.id !== jobId) throw new AppError(COMBINATION_JOB_ERRORS.NOT_FOUND, COMBINATION_JOB_ERRORS.NOT_FOUND);
      if (data.status !== "running") throw new AppError(COMBINATION_JOB_ERRORS.INVALID_JOB_STATE, COMBINATION_JOB_ERRORS.INVALID_JOB_STATE);

      const updatedItems = [...data.items];
      updatedItems[index] = { ...updatedItems[index], ...patch };

      const doneCount = updatedItems.filter(i => i.status === "done").length;
      const errorCount = updatedItems.filter(i => i.status === "error").length;
      const now = Date.now();

      transaction.update(docRef, {
        items: updatedItems,
        doneCount,
        errorCount,
        updatedAt: now,
        heartbeatAt: now,
      });

      return { abortRequested: data.abortRequested };
    });

    return { success: true, data: result };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    if (errorInfo.code === COMBINATION_JOB_ERRORS.NOT_FOUND || errorInfo.message === COMBINATION_JOB_ERRORS.NOT_FOUND) return { success: false, error: COMBINATION_JOB_ERRORS.NOT_FOUND };
    if (errorInfo.code === COMBINATION_JOB_ERRORS.INVALID_JOB_STATE || errorInfo.message === COMBINATION_JOB_ERRORS.INVALID_JOB_STATE) return { success: false, error: COMBINATION_JOB_ERRORS.INVALID_JOB_STATE };

    console.error("Failed to update combination job item", { jobId, index, patch, error: errorInfo });
    return { success: false, error: COMBINATION_JOB_ERRORS.UNKNOWN_ERROR };
  }
};

export const requestAbortCombinationJob = async (jobId: string): Promise<ActionResponse<void, CombinationJobErrorCode>> => {
  if (!(await requireAdmin())) return { success: false, error: COMBINATION_JOB_ERRORS.UNAUTHORIZED };

  try {
    const docRef = getAdminDb().doc(JOB_DOC_PATH);
    await getAdminDb().runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) throw new AppError(COMBINATION_JOB_ERRORS.NOT_FOUND, COMBINATION_JOB_ERRORS.NOT_FOUND);

      const data = snap.data() as CombinationBulkJobDoc;
      if (data.id !== jobId) throw new AppError(COMBINATION_JOB_ERRORS.NOT_FOUND, COMBINATION_JOB_ERRORS.NOT_FOUND);
      if (data.status !== "running") throw new AppError(COMBINATION_JOB_ERRORS.INVALID_JOB_STATE, COMBINATION_JOB_ERRORS.INVALID_JOB_STATE);

      transaction.update(docRef, {
        abortRequested: true,
        updatedAt: Date.now(),
      });
    });

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    if (errorInfo.code === COMBINATION_JOB_ERRORS.NOT_FOUND || errorInfo.message === COMBINATION_JOB_ERRORS.NOT_FOUND) return { success: false, error: COMBINATION_JOB_ERRORS.NOT_FOUND };
    if (errorInfo.code === COMBINATION_JOB_ERRORS.INVALID_JOB_STATE || errorInfo.message === COMBINATION_JOB_ERRORS.INVALID_JOB_STATE) return { success: false, error: COMBINATION_JOB_ERRORS.INVALID_JOB_STATE };

    console.error("Failed to request abort for combination job", { jobId, error: errorInfo });
    return { success: false, error: COMBINATION_JOB_ERRORS.UNKNOWN_ERROR };
  }
};

export const finishCombinationJob = async (
  jobId: string,
  status: "completed" | "aborted" | "failed"
): Promise<ActionResponse<void, CombinationJobErrorCode>> => {
  if (!(await requireAdmin())) return { success: false, error: COMBINATION_JOB_ERRORS.UNAUTHORIZED };

  try {
    const docRef = getAdminDb().doc(JOB_DOC_PATH);
    await getAdminDb().runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) throw new AppError(COMBINATION_JOB_ERRORS.NOT_FOUND, COMBINATION_JOB_ERRORS.NOT_FOUND);

      const data = snap.data() as CombinationBulkJobDoc;
      if (data.id !== jobId) throw new AppError(COMBINATION_JOB_ERRORS.NOT_FOUND, COMBINATION_JOB_ERRORS.NOT_FOUND);
      if (data.status !== "running") throw new AppError(COMBINATION_JOB_ERRORS.INVALID_JOB_STATE, COMBINATION_JOB_ERRORS.INVALID_JOB_STATE);

      const now = Date.now();
      transaction.update(docRef, {
        status,
        updatedAt: now,
        heartbeatAt: now,
      });
    });

    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    if (errorInfo.code === COMBINATION_JOB_ERRORS.NOT_FOUND || errorInfo.message === COMBINATION_JOB_ERRORS.NOT_FOUND) return { success: false, error: COMBINATION_JOB_ERRORS.NOT_FOUND };
    if (errorInfo.code === COMBINATION_JOB_ERRORS.INVALID_JOB_STATE || errorInfo.message === COMBINATION_JOB_ERRORS.INVALID_JOB_STATE) return { success: false, error: COMBINATION_JOB_ERRORS.INVALID_JOB_STATE };

    console.error("Failed to finish combination job", { jobId, status, error: errorInfo });
    return { success: false, error: COMBINATION_JOB_ERRORS.UNKNOWN_ERROR };
  }
};
