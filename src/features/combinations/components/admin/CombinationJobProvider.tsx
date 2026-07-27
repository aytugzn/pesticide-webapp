"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { AdminToast, type AdminToastVariant } from "@/components/ui/AdminToast";
import { DICTIONARY } from "@/constants/dictionary";
import { AppError } from "@/lib/exceptions";
import {
  getActiveCombinationJob,
  requestAbortCombinationJob,
  startCombinationJob,
} from "../../actions/bulk";
import {
  COMBINATION_JOB_ERRORS,
  type BulkCombinationMutationOperation,
  type BulkJobInputItem,
  type BulkProgressItem,
  type CombinationBulkJobDoc,
  type CombinationJobStatus,
  type CombinationLightRow,
} from "../../types";

const ACTIVE_POLL_INTERVAL_MS = 7_000;
const TOAST_INFO_DURATION_MS = 3_500;
const TOAST_ERROR_DURATION_MS = 5_500;
const TERMINAL_JOB_STATUSES = new Set<CombinationJobStatus>([
  "completed",
  "aborted",
  "failed",
  "stale",
]);

type AdminToastInput = {
  variant: AdminToastVariant;
  message: string;
};

type AdminToastState = AdminToastInput & {
  id: number;
};

export type BulkMutationNotice = {
  id: number;
  operation: BulkCombinationMutationOperation;
  affectedKeys: string[];
  affectedRows: CombinationLightRow[];
};

type BulkMutationHandler = (notice: BulkMutationNotice) => void;

type CombinationJobContextType = {
  progress: BulkProgressItem[];
  jobStatus: CombinationJobStatus | null;
  isRunning: boolean;
  doneCount: number;
  total: number;
  hasFinished: boolean;
  allDone: boolean;
  isAbortRequested: boolean;
  failedIndex?: number;
  failureCode?: string;
  showToast: (toast: AdminToastInput) => void;
  showToastSequence: (toasts: AdminToastInput[]) => void;
  notifyBulkMutation: (notice: Omit<BulkMutationNotice, "id">) => void;
  subscribeBulkMutation: (handler: BulkMutationHandler) => () => void;
  refreshJob: () => Promise<void>;
  startBulkGenerate: (missingItems: BulkJobInputItem[]) => Promise<void>;
  abortBulkGenerate: () => Promise<void>;
};

const CombinationJobContext = createContext<CombinationJobContextType | null>(
  null,
);

/** Returns the shared combination job and admin notification context. */
export const useCombinationJob = (): CombinationJobContextType => {
  const context = useContext(CombinationJobContext);
  if (!context) {
    throw new AppError(
      "useCombinationJob must be used within a CombinationJobProvider",
      "COMBINATION_JOB_PROVIDER_MISSING",
    );
  }
  return context;
};

/** Returns only the admin toast helpers for unrelated admin features. */
export const useCombinationAdminToast = () => {
  const context = useCombinationJob();
  return {
    showToast: context.showToast,
    showToastSequence: context.showToastSequence,
  };
};

const getToastDuration = (variant: AdminToastVariant): number =>
  variant === "error" || variant === "warning"
    ? TOAST_ERROR_DURATION_MS
    : TOAST_INFO_DURATION_MS;

const getToastTitle = (variant: AdminToastVariant): string => {
  const dictionary = DICTIONARY.admin.combinations.toast;
  if (variant === "success") return dictionary.successTitle;
  if (variant === "warning") return dictionary.warningTitle;
  if (variant === "error") return dictionary.errorTitle;
  return dictionary.infoTitle;
};

const getStartErrorMessage = (errorCode: string): string => {
  const dictionary = DICTIONARY.admin.combinations;
  if (errorCode === COMBINATION_JOB_ERRORS.ALREADY_RUNNING) {
    return dictionary.bulkGenerate.errorAlreadyRunning;
  }
  if (errorCode === COMBINATION_JOB_ERRORS.GITHUB_CONFIG_INVALID) {
    return dictionary.bulkGenerate.errorGithubConfig;
  }
  if (errorCode === COMBINATION_JOB_ERRORS.DISPATCH_FAILED) {
    return dictionary.bulkGenerate.errorDispatch;
  }
  return dictionary.errorDefault;
};

/**
 * Provides Firestore-polled background job state and shared admin notifications.
 *
 * @param children - Admin application content
 */
export const CombinationJobProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const pathname = usePathname();
  const isCombinationsPage = pathname === "/admin/combinations";
  const [job, setJob] = useState<CombinationBulkJobDoc | null>(null);
  const [toast, setToast] = useState<AdminToastState | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastSequenceTimeoutRefs = useRef(
    new Set<ReturnType<typeof setTimeout>>(),
  );
  const bulkMutationNoticeIdRef = useRef(0);
  const bulkMutationHandlersRef = useRef(new Set<BulkMutationHandler>());

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const displayToast = useCallback((nextToast: AdminToastInput) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    const id = Date.now();
    setToast({ ...nextToast, id });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
      toastTimeoutRef.current = null;
    }, getToastDuration(nextToast.variant));
  }, []);

  const clearToastSequence = useCallback(() => {
    toastSequenceTimeoutRefs.current.forEach(clearTimeout);
    toastSequenceTimeoutRefs.current.clear();
  }, []);

  const showToast = useCallback(
    (nextToast: AdminToastInput) => {
      clearToastSequence();
      displayToast(nextToast);
    },
    [clearToastSequence, displayToast],
  );

  const showToastSequence = useCallback(
    (toasts: AdminToastInput[]) => {
      clearToastSequence();
      if (toasts.length === 0) return;
      displayToast(toasts[0]);
      let delayMs = 0;
      toasts.slice(1).forEach((nextToast, index) => {
        delayMs += getToastDuration(toasts[index].variant);
        const timeout = setTimeout(() => {
          toastSequenceTimeoutRefs.current.delete(timeout);
          displayToast(nextToast);
        }, delayMs);
        toastSequenceTimeoutRefs.current.add(timeout);
      });
    },
    [clearToastSequence, displayToast],
  );

  const notifyBulkMutation = useCallback(
    (notice: Omit<BulkMutationNotice, "id">) => {
      bulkMutationNoticeIdRef.current += 1;
      const nextNotice = { ...notice, id: bulkMutationNoticeIdRef.current };
      bulkMutationHandlersRef.current.forEach((handler) =>
        handler(nextNotice),
      );
    },
    [],
  );

  const subscribeBulkMutation = useCallback(
    (handler: BulkMutationHandler) => {
      const handlers = bulkMutationHandlersRef.current;
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    [],
  );

  const refreshJob = useCallback(async () => {
    const response = await getActiveCombinationJob();
    if (response.success) setJob(response.data || null);
  }, []);

  const startBulkGenerate = useCallback(
    async (missingItems: BulkJobInputItem[]) => {
      if (missingItems.length === 0) return;
      const response = await startCombinationJob(missingItems);
      if (!response.success || !response.data) {
        showToast({
          variant: "error",
          message: getStartErrorMessage(
            response.success
              ? COMBINATION_JOB_ERRORS.UNKNOWN_ERROR
              : response.error,
          ),
        });
        await refreshJob();
        return;
      }

      setJob(response.data);
      showToast({
        variant: "info",
        message: DICTIONARY.admin.combinations.bulkGenerate.queuedToast,
      });
    },
    [refreshJob, showToast],
  );

  const abortBulkGenerate = useCallback(async () => {
    if (!job || (job.status !== "queued" && job.status !== "running")) return;
    setJob((current) =>
      current ? { ...current, abortRequested: true } : current,
    );
    const response = await requestAbortCombinationJob(job.id);
    if (!response.success) {
      showToast({
        variant: "error",
        message: DICTIONARY.admin.combinations.errorDefault,
      });
    }
    await refreshJob();
  }, [job, refreshJob, showToast]);

  const jobStatus = job?.status || null;
  const isRunning = jobStatus === "queued" || jobStatus === "running";
  const hasFinished = jobStatus ? TERMINAL_JOB_STATUSES.has(jobStatus) : false;
  const allDone =
    jobStatus === "completed" &&
    Boolean(job && job.total > 0 && job.doneCount === job.total);

  useEffect(() => {
    if (!isCombinationsPage) return;
    const refreshTimer = setTimeout(() => void refreshJob(), 0);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refreshJob();
    };
    const handleFocus = () => void refreshJob();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    const interval = isRunning
      ? setInterval(() => void refreshJob(), ACTIVE_POLL_INTERVAL_MS)
      : null;
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      clearTimeout(refreshTimer);
      if (interval) clearInterval(interval);
    };
  }, [isCombinationsPage, isRunning, refreshJob]);

  useEffect(
    () => () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastSequenceTimeoutRefs.current.forEach(clearTimeout);
      toastSequenceTimeoutRefs.current.clear();
    },
    [],
  );

  return (
    <CombinationJobContext.Provider
      value={{
        progress: job?.items || [],
        jobStatus,
        isRunning,
        doneCount: job?.doneCount || 0,
        total: job?.total || 0,
        hasFinished,
        allDone,
        isAbortRequested: job?.abortRequested || false,
        failedIndex: job?.failedIndex,
        failureCode: job?.failureCode,
        showToast,
        showToastSequence,
        notifyBulkMutation,
        subscribeBulkMutation,
        refreshJob,
        startBulkGenerate,
        abortBulkGenerate,
      }}
    >
      {children}
      {toast && (
        <AdminToast
          variant={toast.variant}
          title={getToastTitle(toast.variant)}
          message={toast.message}
          durationMs={getToastDuration(toast.variant)}
          onClose={dismissToast}
          closeAriaLabel={DICTIONARY.global.ui.closeAria}
        />
      )}
    </CombinationJobContext.Provider>
  );
};
