"use server";

import "server-only";

import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { AppError } from "@/lib/exceptions";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ActionResponse } from "@/types";
import {
  combinationJobIdSchema,
  startCombinationJobSchema,
} from "../schemas";
import {
  COMBINATION_ERRORS,
  COMBINATION_JOB_ERRORS,
  type BulkJobInputItem,
  type CombinationBulkJobDoc,
  type CombinationErrorCode,
  type CombinationJobErrorCode,
} from "../types";
import { dispatchCombinationWorkflow } from "../server/githubActions";
import { parseCombinationJobDoc } from "../server/jobDoc";
import {
  COMBINATION_JOB_DOC_PATH,
  isCombinationJobHeartbeatStale,
} from "../server/jobConfig";
import { getErrorInfo } from "./utils";


/**
 * Fetches lightweight existing combination keys for missing-item calculation.
 *
 * @returns Canonical combination identifiers, including archived records
 */
export const getExistingCombinationKeys = async (): Promise<
  ActionResponse<string[], CombinationErrorCode>
> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
  }

  try {
    const snapshot = await getAdminDb()
      .collection("combinations")
      .select("region", "pest")
      .get();
    const keys = snapshot.docs.flatMap((document) => {
      const data = document.data() as Record<string, unknown>;
      return typeof data.region === "string" && typeof data.pest === "string"
        ? [`${data.region}_${data.pest}`]
        : [];
    });
    return { success: true, data: keys };
  } catch (error: unknown) {
    console.error("Combination keys fetch failed", {
      errorCode: getErrorInfo(error).code,
    });
    return { success: false, error: COMBINATION_ERRORS.FETCH_FAILED };
  }
};

/**
 * Reads the persisted background job and marks an expired running heartbeat stale.
 *
 * @returns Current job document or null when no job has been created
 */
export const getActiveCombinationJob = async (): Promise<
  ActionResponse<CombinationBulkJobDoc | null, CombinationJobErrorCode>
> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_JOB_ERRORS.UNAUTHORIZED };
  }

  try {
    const db = getAdminDb();
    const jobRef = db.doc(COMBINATION_JOB_DOC_PATH);
    const snapshot = await jobRef.get();
    if (!snapshot.exists) return { success: true, data: null };

    const job = parseCombinationJobDoc(snapshot.data());
    if (!job) {
      return { success: false, error: COMBINATION_JOB_ERRORS.INVALID_JOB };
    }

    const now = Date.now();
    if (
      job.status !== "running" ||
      !isCombinationJobHeartbeatStale(job.heartbeatAt, now)
    ) {
      return { success: true, data: job };
    }

    const staleJob = await db.runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(jobRef);
      if (!currentSnapshot.exists) return null;
      const current = parseCombinationJobDoc(currentSnapshot.data());
      if (
        !current ||
        current.id !== job.id ||
        current.status !== "running" ||
        !isCombinationJobHeartbeatStale(current.heartbeatAt, now)
      ) {
        return current;
      }

      const updated: CombinationBulkJobDoc = {
        ...current,
        status: "stale",
        updatedAt: now,
        finishedAt: now,
      };
      transaction.update(jobRef, {
        status: updated.status,
        updatedAt: updated.updatedAt,
        finishedAt: updated.finishedAt,
      });
      return updated;
    });

    return { success: true, data: staleJob };
  } catch (error: unknown) {
    console.error("Combination job fetch failed", {
      errorCode: getErrorInfo(error).code,
    });
    return { success: false, error: COMBINATION_JOB_ERRORS.UNKNOWN_ERROR };
  }
};

/**
 * Creates a queued Firestore job and dispatches the GitHub Actions worker.
 *
 * @param items - Missing region-pest pairs to generate
 * @returns Queued job only after GitHub accepts the workflow dispatch
 */
export const startCombinationJob = async (
  items: BulkJobInputItem[],
): Promise<ActionResponse<CombinationBulkJobDoc, CombinationJobErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_JOB_ERRORS.UNAUTHORIZED };
  }

  const parsedItems = startCombinationJobSchema.safeParse(items);
  if (!parsedItems.success) {
    return {
      success: false,
      error: COMBINATION_JOB_ERRORS.VALIDATION_FAILED,
    };
  }

  const db = getAdminDb();
  const jobRef = db.doc(COMBINATION_JOB_DOC_PATH);
  let newJob: CombinationBulkJobDoc;

  try {
    newJob = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(jobRef);
      const now = Date.now();

      if (snapshot.exists) {
        const current = parseCombinationJobDoc(snapshot.data());
        if (!current) {
          throw new AppError(
            COMBINATION_JOB_ERRORS.INVALID_JOB,
            COMBINATION_JOB_ERRORS.INVALID_JOB,
          );
        }
        const hasActiveJob =
          current.status === "queued" ||
          (current.status === "running" &&
            !isCombinationJobHeartbeatStale(current.heartbeatAt, now));
        if (hasActiveJob) {
          throw new AppError(
            COMBINATION_JOB_ERRORS.ALREADY_RUNNING,
            COMBINATION_JOB_ERRORS.ALREADY_RUNNING,
          );
        }
      }

      const job: CombinationBulkJobDoc = {
        id: randomUUID(),
        type: "bulkCombinationGeneration",
        status: "queued",
        createdAt: now,
        updatedAt: now,
        total: parsedItems.data.length,
        doneCount: 0,
        errorCount: 0,
        currentIndex: 0,
        abortRequested: false,
        items: parsedItems.data.map((item) => ({
          ...item,
          status: "pending",
          attemptCount: 0,
        })),
      };
      transaction.set(jobRef, job);
      return job;
    });
  } catch (error: unknown) {
    const errorCode = getErrorInfo(error).code;
    if (errorCode === COMBINATION_JOB_ERRORS.ALREADY_RUNNING) {
      return { success: false, error: COMBINATION_JOB_ERRORS.ALREADY_RUNNING };
    }
    if (errorCode === COMBINATION_JOB_ERRORS.INVALID_JOB) {
      return { success: false, error: COMBINATION_JOB_ERRORS.INVALID_JOB };
    }
    console.error("Combination job create failed", { errorCode });
    return { success: false, error: COMBINATION_JOB_ERRORS.UNKNOWN_ERROR };
  }

  try {
    await dispatchCombinationWorkflow(newJob.id);
    return { success: true, data: newJob };
  } catch (error: unknown) {
    const errorCode = getErrorInfo(error).code;
    const failureCode =
      errorCode === COMBINATION_JOB_ERRORS.GITHUB_CONFIG_INVALID
        ? COMBINATION_JOB_ERRORS.GITHUB_CONFIG_INVALID
        : COMBINATION_JOB_ERRORS.DISPATCH_FAILED;
    const now = Date.now();

    try {
      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(jobRef);
        if (!snapshot.exists) return;
        const current = parseCombinationJobDoc(snapshot.data());
        if (current?.id !== newJob.id || current.status !== "queued") return;
        transaction.update(jobRef, {
          status: "failed",
          updatedAt: now,
          finishedAt: now,
          failureCode,
        });
      });
    } catch (updateError: unknown) {
      console.error("Dispatch failure state update failed", {
        jobId: newJob.id,
        errorCode: getErrorInfo(updateError).code,
      });
    }

    console.error("Combination workflow dispatch failed", {
      jobId: newJob.id,
      failureCode,
    });
    return { success: false, error: failureCode };
  }
};

/**
 * Aborts a queued job immediately or requests cooperative stop from a worker.
 *
 * @param jobId - Current job identifier
 * @returns Typed action result
 */
export const requestAbortCombinationJob = async (
  jobId: string,
): Promise<ActionResponse<void, CombinationJobErrorCode>> => {
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_JOB_ERRORS.UNAUTHORIZED };
  }

  const parsedJobId = combinationJobIdSchema.safeParse(jobId);
  if (!parsedJobId.success) {
    return {
      success: false,
      error: COMBINATION_JOB_ERRORS.VALIDATION_FAILED,
    };
  }

  try {
    const db = getAdminDb();
    const jobRef = db.doc(COMBINATION_JOB_DOC_PATH);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(jobRef);
      if (!snapshot.exists) {
        throw new AppError(
          COMBINATION_JOB_ERRORS.NOT_FOUND,
          COMBINATION_JOB_ERRORS.NOT_FOUND,
        );
      }
      const current = parseCombinationJobDoc(snapshot.data());
      if (!current || current.id !== parsedJobId.data) {
        throw new AppError(
          COMBINATION_JOB_ERRORS.NOT_FOUND,
          COMBINATION_JOB_ERRORS.NOT_FOUND,
        );
      }

      const now = Date.now();
      if (current.status === "queued") {
        transaction.update(jobRef, {
          status: "aborted",
          abortRequested: true,
          updatedAt: now,
          finishedAt: now,
        });
        return;
      }
      if (current.status === "running") {
        transaction.update(jobRef, {
          abortRequested: true,
          updatedAt: now,
        });
        return;
      }

      throw new AppError(
        COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
        COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
      );
    });
    return { success: true };
  } catch (error: unknown) {
    const errorCode = getErrorInfo(error).code;
    if (errorCode === COMBINATION_JOB_ERRORS.NOT_FOUND) {
      return { success: false, error: COMBINATION_JOB_ERRORS.NOT_FOUND };
    }
    if (errorCode === COMBINATION_JOB_ERRORS.INVALID_JOB_STATE) {
      return {
        success: false,
        error: COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
      };
    }
    console.error("Combination abort request failed", { jobId, errorCode });
    return { success: false, error: COMBINATION_JOB_ERRORS.UNKNOWN_ERROR };
  }
};
