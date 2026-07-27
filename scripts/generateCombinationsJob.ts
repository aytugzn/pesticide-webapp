import { randomUUID } from "node:crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { AppError } from "@/lib/exceptions";
import { DICTIONARY } from "@/constants/dictionary";
import { getAdminDb } from "@/lib/firebaseAdminCore";
import { workerArgumentsSchema } from "@/features/combinations/schemas";
import {
  COMBINATION_ERRORS,
  COMBINATION_JOB_ERRORS,
  type BulkProgressItem,
  type CombinationBulkJobDoc,
  type CombinationErrorCode,
  type CombinationJobFailureCode,
} from "@/features/combinations/types";
import {
  generateCombinationContentCore,
  inspectCombinationCreateState,
  saveCombinationCore,
} from "@/features/combinations/server/generationCore";
import { parseCombinationJobDoc } from "@/features/combinations/server/jobDoc";
import {
  COMBINATION_JOB_BOOKKEEPING_RETRY_DELAYS_MS,
  COMBINATION_JOB_DOC_PATH,
  COMBINATION_JOB_MAX_ATTEMPTS,
  COMBINATION_JOB_RETRY_DELAYS_MS,
  isCombinationJobHeartbeatStale,
} from "@/features/combinations/server/jobConfig";
import { getErrorInfo } from "@/features/combinations/actions/utils";

type WorkerContext = {
  db: Firestore;
  jobId: string;
  workerRunId: string;
};

type ClaimResult =
  | { state: "claimed"; job: CombinationBulkJobDoc }
  | { state: "aborted" }
  | { state: "skipped" };

type AttemptStart =
  | { state: "started"; item: BulkProgressItem }
  | { state: "aborted" }
  | { state: "done" }
  | { state: "exhausted" };

type BookkeepingOperation =
  | "markItemDone"
  | "markRetryPending"
  | "failJob"
  | "finalizeAborted"
  | "completeJob";

class RecoverableBookkeepingError extends AppError {
  constructor(public readonly operation: BookkeepingOperation) {
    super(
      COMBINATION_JOB_ERRORS.WORKER_FAILED,
      COMBINATION_JOB_ERRORS.WORKER_FAILED,
    );
  }
}

class TerminalItemError extends AppError {
  constructor(public readonly failureCode: CombinationJobFailureCode) {
    super(failureCode, failureCode);
  }
}

const RETRYABLE_ERRORS = new Set<CombinationErrorCode>([
  COMBINATION_ERRORS.AI_QUOTA_EXCEEDED,
  COMBINATION_ERRORS.AI_PROVIDER_UNAVAILABLE,
  COMBINATION_ERRORS.AI_GENERATION_FAILED,
  COMBINATION_ERRORS.VALIDATION_FAILED,
  COMBINATION_ERRORS.SAVE_FAILED,
]);

const SAFE_FAILURE_CODES = new Set<string>([
  ...Object.values(COMBINATION_ERRORS),
  ...Object.values(COMBINATION_JOB_ERRORS),
]);

let signalRequested = false;

/** Builds an item without leaking a previous safe error code. */
const createProgressItem = (
  item: BulkProgressItem,
  status: BulkProgressItem["status"],
  error?: string,
): BulkProgressItem => ({
  regionSlug: item.regionSlug,
  regionName: item.regionName,
  pestSlug: item.pestSlug,
  pestName: item.pestName,
  status,
  attemptCount: item.attemptCount,
  ...(error ? { error } : {}),
});

/** Retries only idempotent job-state writes and hides raw provider errors. */
const runBookkeepingWithRetry = async <Result>(
  operation: BookkeepingOperation,
  task: () => Promise<Result>,
): Promise<Result> => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await task();
    } catch {
      const delayMs = COMBINATION_JOB_BOOKKEEPING_RETRY_DELAYS_MS[attempt];
      if (delayMs === undefined) {
        throw new RecoverableBookkeepingError(operation);
      }

      console.warn("Combination job bookkeeping retry", {
        operation,
        attempt: attempt + 1,
      });
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
  }
};

/** Converts unknown exceptions into allowlisted persisted failure codes. */
const getFailureCode = (error: unknown): CombinationJobFailureCode => {
  const code = getErrorInfo(error).code;
  return code && SAFE_FAILURE_CODES.has(code)
    ? (code as CombinationJobFailureCode)
    : COMBINATION_JOB_ERRORS.WORKER_FAILED;
};

/** Builds a traceable identifier for the current GitHub run attempt. */
const getWorkerRunId = (): string => {
  const runId = process.env.GITHUB_RUN_ID?.trim();
  const runAttempt = process.env.GITHUB_RUN_ATTEMPT?.trim();
  return runId
    ? `${runId}:${runAttempt || "1"}`
    : `local:${randomUUID()}`;
};

/** Parses CLI arguments before any credential or Firestore access. */
const parseWorkerArguments = (
  args: string[],
): { help: boolean; jobId?: string } => {
  if (args.includes("--help") || args.includes("-h")) {
    return { help: true };
  }

  if (args.length !== 2 || args[0] !== "--job-id") {
    throw new AppError(
      COMBINATION_JOB_ERRORS.INVALID_JOB,
      COMBINATION_JOB_ERRORS.INVALID_JOB,
    );
  }

  const parsed = workerArgumentsSchema.safeParse({ jobId: args[1] });
  if (!parsed.success) {
    throw new AppError(
      COMBINATION_JOB_ERRORS.INVALID_JOB,
      COMBINATION_JOB_ERRORS.INVALID_JOB,
    );
  }

  return { help: false, jobId: parsed.data.jobId };
};

/** Claims a queued or stale job transactionally and rejects duplicate workers. */
const claimJob = async (
  context: WorkerContext,
): Promise<ClaimResult> => {
  const jobRef = context.db.doc(COMBINATION_JOB_DOC_PATH);
  return context.db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(jobRef);
    if (!snapshot.exists) {
      throw new AppError(
        COMBINATION_JOB_ERRORS.NOT_FOUND,
        COMBINATION_JOB_ERRORS.NOT_FOUND,
      );
    }

    const job = parseCombinationJobDoc(snapshot.data());
    if (!job) {
      throw new AppError(
        COMBINATION_JOB_ERRORS.INVALID_JOB,
        COMBINATION_JOB_ERRORS.INVALID_JOB,
      );
    }
    if (job.id !== context.jobId) return { state: "skipped" };

    const now = Date.now();
    const canTakeOverRunning =
      job.status === "running" &&
      isCombinationJobHeartbeatStale(job.heartbeatAt, now);
    const canClaim =
      job.status === "queued" ||
      job.status === "stale" ||
      canTakeOverRunning;

    if (job.abortRequested && canClaim) {
      transaction.update(jobRef, {
        status: "aborted",
        updatedAt: now,
        finishedAt: now,
      });
      return { state: "aborted" };
    }
    if (!canClaim) return { state: "skipped" };

    const items = job.items.map((item) =>
      item.status === "generating"
        ? createProgressItem(item, "pending")
        : item,
    );
    const claimedJob: CombinationBulkJobDoc = {
      ...job,
      status: "running",
      startedAt: job.startedAt || now,
      finishedAt: undefined,
      heartbeatAt: now,
      updatedAt: now,
      workerRunId: context.workerRunId,
      currentIndex: job.currentIndex,
      items,
    };
    transaction.update(jobRef, {
      status: claimedJob.status,
      startedAt: claimedJob.startedAt,
      finishedAt: FieldValue.delete(),
      heartbeatAt: now,
      updatedAt: now,
      workerRunId: context.workerRunId,
      currentIndex: job.currentIndex,
      items,
    });
    return { state: "claimed", job: claimedJob };
  });
};

/** Reads the job while enforcing current worker ownership. */
const readOwnedJob = async (
  context: WorkerContext,
): Promise<CombinationBulkJobDoc> => {
  const snapshot = await context.db.doc(COMBINATION_JOB_DOC_PATH).get();
  const job = snapshot.exists
    ? parseCombinationJobDoc(snapshot.data())
    : null;
  if (!job || job.id !== context.jobId) {
    throw new AppError(
      COMBINATION_JOB_ERRORS.INVALID_JOB,
      COMBINATION_JOB_ERRORS.INVALID_JOB,
    );
  }
  if (
    job.status !== "running" ||
    job.workerRunId !== context.workerRunId
  ) {
    throw new AppError(
      COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
      COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
    );
  }
  return job;
};

/** Checks cooperative abort and process signal state. */
const isAbortRequested = async (
  context: WorkerContext,
): Promise<boolean> => {
  if (signalRequested) return true;
  const job = await readOwnedJob(context);
  return job.abortRequested;
};

/** Increments an item attempt and refreshes the worker heartbeat transactionally. */
const beginAttempt = async (
  context: WorkerContext,
  index: number,
): Promise<AttemptStart> => {
  const jobRef = context.db.doc(COMBINATION_JOB_DOC_PATH);
  return context.db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(jobRef);
    const job = snapshot.exists
      ? parseCombinationJobDoc(snapshot.data())
      : null;
    if (
      !job ||
      job.id !== context.jobId ||
      job.status !== "running" ||
      job.workerRunId !== context.workerRunId
    ) {
      throw new AppError(
        COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
        COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
      );
    }
    if (job.abortRequested || signalRequested) return { state: "aborted" };

    const item = job.items[index];
    if (!item) {
      throw new AppError(
        COMBINATION_JOB_ERRORS.INVALID_JOB,
        COMBINATION_JOB_ERRORS.INVALID_JOB,
      );
    }
    if (item.status === "done") return { state: "done" };
    if (item.attemptCount >= COMBINATION_JOB_MAX_ATTEMPTS) {
      return { state: "exhausted" };
    }

    const now = Date.now();
    const updatedItem: BulkProgressItem = {
      ...createProgressItem(item, "generating"),
      attemptCount: item.attemptCount + 1,
    };
    const items = [...job.items];
    items[index] = updatedItem;
    transaction.update(jobRef, {
      items,
      currentIndex: index,
      updatedAt: now,
      heartbeatAt: now,
    });
    return { state: "started", item: updatedItem };
  });
};

/** Marks one item done and recomputes persisted counters. */
const markItemDone = async (
  context: WorkerContext,
  index: number,
): Promise<void> =>
  runBookkeepingWithRetry("markItemDone", async () => {
    const jobRef = context.db.doc(COMBINATION_JOB_DOC_PATH);
    await context.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(jobRef);
      const job = snapshot.exists
        ? parseCombinationJobDoc(snapshot.data())
        : null;
      if (
        !job ||
        job.id !== context.jobId ||
        job.status !== "running" ||
        job.workerRunId !== context.workerRunId
      ) {
        throw new AppError(
          COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
          COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
        );
      }

      const item = job.items[index];
      if (!item || item.status === "done") return;
      const items = [...job.items];
      items[index] = createProgressItem(item, "done");
      const now = Date.now();
      transaction.update(jobRef, {
        items,
        doneCount: items.filter((entry) => entry.status === "done").length,
        errorCount: items.filter((entry) => entry.status === "error").length,
        currentIndex: index + 1,
        updatedAt: now,
        heartbeatAt: now,
      });
    });
  });

/** Returns a retryable item to pending while preserving its attempt count. */
const markRetryPending = async (
  context: WorkerContext,
  index: number,
): Promise<void> =>
  runBookkeepingWithRetry("markRetryPending", async () => {
    const jobRef = context.db.doc(COMBINATION_JOB_DOC_PATH);
    await context.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(jobRef);
      const job = snapshot.exists
        ? parseCombinationJobDoc(snapshot.data())
        : null;
      if (
        !job ||
        job.id !== context.jobId ||
        job.status !== "running" ||
        job.workerRunId !== context.workerRunId
      ) {
        throw new AppError(
          COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
          COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
        );
      }
      const item = job.items[index];
      if (!item) return;
      const items = [...job.items];
      items[index] = createProgressItem(item, "pending");
      const now = Date.now();
      transaction.update(jobRef, {
        items,
        updatedAt: now,
        heartbeatAt: now,
      });
    });
  });

/** Fails the current item and entire job without starting later items. */
const failJob = async (
  context: WorkerContext,
  index: number,
  failureCode: CombinationJobFailureCode,
): Promise<void> =>
  runBookkeepingWithRetry("failJob", async () => {
    const jobRef = context.db.doc(COMBINATION_JOB_DOC_PATH);
    await context.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(jobRef);
      const job = snapshot.exists
        ? parseCombinationJobDoc(snapshot.data())
        : null;
      if (
        !job ||
        job.id !== context.jobId ||
        job.status !== "running" ||
        job.workerRunId !== context.workerRunId
      ) {
        return;
      }

      const items = [...job.items];
      const item = items[index];
      if (item) items[index] = createProgressItem(item, "error", failureCode);
      const now = Date.now();
      transaction.update(jobRef, {
        status: "failed",
        items,
        doneCount: items.filter((entry) => entry.status === "done").length,
        errorCount: items.filter((entry) => entry.status === "error").length,
        failedIndex: index,
        failureCode,
        currentIndex: index,
        updatedAt: now,
        heartbeatAt: now,
        finishedAt: now,
      });
    });
  });

/** Persists one known terminal item failure exactly once before exiting. */
const failTerminalItem = async (
  context: WorkerContext,
  index: number,
  failureCode: CombinationJobFailureCode,
): Promise<never> => {
  await failJob(context, index, failureCode);
  throw new TerminalItemError(failureCode);
};

/** Closes the owned running job as aborted. */
const finalizeAborted = async (context: WorkerContext): Promise<void> =>
  runBookkeepingWithRetry("finalizeAborted", async () => {
    const jobRef = context.db.doc(COMBINATION_JOB_DOC_PATH);
    await context.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(jobRef);
      const job = snapshot.exists
        ? parseCombinationJobDoc(snapshot.data())
        : null;
      if (
        !job ||
        job.id !== context.jobId ||
        job.status !== "running" ||
        job.workerRunId !== context.workerRunId
      ) {
        return;
      }
      const items = job.items.map((item) =>
        item.status === "generating"
          ? createProgressItem(item, "pending")
          : item,
      );
      const now = Date.now();
      transaction.update(jobRef, {
        status: "aborted",
        abortRequested: true,
        items,
        updatedAt: now,
        heartbeatAt: now,
        finishedAt: now,
      });
    });
  });

/** Completes the job only when every item is done. */
const completeJob = async (context: WorkerContext): Promise<void> =>
  runBookkeepingWithRetry("completeJob", async () => {
    const jobRef = context.db.doc(COMBINATION_JOB_DOC_PATH);
    await context.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(jobRef);
      const job = snapshot.exists
        ? parseCombinationJobDoc(snapshot.data())
        : null;
      if (!job || job.id !== context.jobId) {
        throw new AppError(
          COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
          COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
        );
      }
      if (
        job.status === "completed" &&
        job.items.every((item) => item.status === "done")
      ) {
        return;
      }
      if (
        job.status !== "running" ||
        job.workerRunId !== context.workerRunId ||
        job.items.some((item) => item.status !== "done")
      ) {
        throw new AppError(
          COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
          COMBINATION_JOB_ERRORS.INVALID_JOB_STATE,
        );
      }
      const now = Date.now();
      transaction.update(jobRef, {
        status: "completed",
        doneCount: job.items.length,
        errorCount: 0,
        currentIndex: job.items.length,
        updatedAt: now,
        heartbeatAt: now,
        finishedAt: now,
      });
    });
  });

/** Waits with one-second abort checks between retry attempts. */
const waitForRetry = async (
  context: WorkerContext,
  delayMs: number,
): Promise<boolean> => {
  const deadline = Date.now() + delayMs;
  while (Date.now() < deadline) {
    if (await isAbortRequested(context)) return false;
    const remaining = deadline - Date.now();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, Math.min(1_000, remaining));
    });
  }
  return !(await isAbortRequested(context));
};

/** Processes one item with idempotency checks and bounded retries. */
const processItem = async (
  context: WorkerContext,
  index: number,
): Promise<boolean> => {
  while (true) {
    if (await isAbortRequested(context)) return false;

    const currentJob = await readOwnedJob(context);
    const currentItem = currentJob.items[index];
    if (!currentItem) {
      throw new AppError(
        COMBINATION_JOB_ERRORS.INVALID_JOB,
        COMBINATION_JOB_ERRORS.INVALID_JOB,
      );
    }
    if (currentItem.status === "done") return true;

    const existing = await inspectCombinationCreateState(
      context.db,
      currentItem.regionSlug,
      currentItem.pestSlug,
    );
    if (existing.success && existing.data === "existing") {
      await markItemDone(context, index);
      return true;
    }

    const attempt = await beginAttempt(context, index);
    if (attempt.state === "aborted") return false;
    if (attempt.state === "done") return true;
    if (attempt.state === "exhausted") {
      return failTerminalItem(
        context,
        index,
        COMBINATION_JOB_ERRORS.WORKER_FAILED,
      );
    }

    let failureCode: CombinationErrorCode | null = null;
    if (!existing.success) {
      failureCode = existing.error;
    } else {
      const generated = await generateCombinationContentCore(
        context.db,
        attempt.item.regionSlug,
        attempt.item.pestSlug,
      );
      if (!generated.success || !generated.data) {
        failureCode = generated.success
          ? COMBINATION_ERRORS.AI_GENERATION_FAILED
          : generated.error;
      } else if (await isAbortRequested(context)) {
        return false;
      } else {
        const saved = await saveCombinationCore(context.db, {
          regionSlug: attempt.item.regionSlug,
          pestSlug: attempt.item.pestSlug,
          regionName: attempt.item.regionName,
          pestName: attempt.item.pestName,
          content: generated.data,
          isActive: true,
        });
        if (saved.success || saved.error === COMBINATION_ERRORS.ALREADY_EXISTS) {
          await markItemDone(context, index);
          return true;
        }
        failureCode = saved.error;
      }
    }

    if (!failureCode) {
      failureCode = COMBINATION_ERRORS.AI_GENERATION_FAILED;
    }
    const canRetry =
      RETRYABLE_ERRORS.has(failureCode) &&
      attempt.item.attemptCount < COMBINATION_JOB_MAX_ATTEMPTS;
    if (!canRetry) {
      return failTerminalItem(context, index, failureCode);
    }

    await markRetryPending(context, index);
    const retryDelay =
      COMBINATION_JOB_RETRY_DELAYS_MS[attempt.item.attemptCount - 1] || 0;
    if (!(await waitForRetry(context, retryDelay))) return false;
  }
};

/** Runs argument validation, claim, sequential processing and completion. */
const executeWorker = async (): Promise<void> => {
  const args = parseWorkerArguments(process.argv.slice(2));
  if (args.help) {
    console.log(DICTIONARY.admin.combinations.bulkGenerate.workerHelp);

    return;
  }
  if (!args.jobId) {
    throw new AppError(
      COMBINATION_JOB_ERRORS.INVALID_JOB,
      COMBINATION_JOB_ERRORS.INVALID_JOB,
    );
  }

  const context: WorkerContext = {
    db: getAdminDb(),
    jobId: args.jobId,
    workerRunId: getWorkerRunId(),
  };
  const claim = await claimJob(context);
  if (claim.state === "skipped") {
    console.log("Combination job was not claimable", { jobId: context.jobId });
    return;
  }
  if (claim.state === "aborted") {
    console.log("Combination job was aborted before claim", {
      jobId: context.jobId,
    });
    return;
  }

  for (let index = 0; index < claim.job.items.length; index += 1) {
    const job = await readOwnedJob(context);
    if (job.abortRequested || signalRequested) {
      await finalizeAborted(context);
      return;
    }
    if (job.items[index]?.status === "done") continue;
    if (!(await processItem(context, index))) {
      await finalizeAborted(context);
      return;
    }
  }

  await completeJob(context);
  console.log("Combination job completed", { jobId: context.jobId });
};

process.once("SIGTERM", () => {
  signalRequested = true;
  console.warn("Combination worker received SIGTERM");
});

process.once("SIGINT", () => {
  signalRequested = true;
  console.warn("Combination worker received SIGINT");
});

executeWorker().catch((error: unknown) => {
  const failureCode = getFailureCode(error);
  if (error instanceof RecoverableBookkeepingError) {
    console.error("Combination worker stopped with recoverable job state", {
      failureCode,
      operation: error.operation,
    });
  } else {
    console.error("Combination worker failed", { failureCode });
  }
  process.exitCode = 1;
});
