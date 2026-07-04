"use client";

import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppError } from "@/lib/exceptions";
import { generateCombinationContent } from "../../actions";
import {
  saveCombinationSilently,
  getActiveCombinationJob,
  startCombinationJob,
  updateCombinationJobItem,
  requestAbortCombinationJob,
  finishCombinationJob
} from "../../actions/bulk";
import type { BulkProgressItem } from "../../types";

const RATE_LIMIT_DELAY_MS = 1500;
const RUNNING_POLL_INTERVAL_MS = 10_000;

type CombinationJobContextType = {
  progress: BulkProgressItem[];
  isRunning: boolean;
  doneCount: number;
  total: number;
  hasFinished: boolean;
  allDone: boolean;
  isOwner: boolean;
  isAbortRequested: boolean;
  startBulkGenerate: (missingItems: BulkProgressItem[]) => Promise<void>;
  abortBulkGenerate: () => Promise<void>;
};

const CombinationJobContext = createContext<CombinationJobContextType | null>(null);

export const useCombinationJob = () => {
  const context = useContext(CombinationJobContext);
  if (!context) {
    throw new AppError(
      "useCombinationJob must be used within a CombinationJobProvider",
      "COMBINATION_JOB_PROVIDER_MISSING"
    );
  }
  return context;
};

const getSafeErrorInfo = (error: unknown) => ({
  message: error instanceof Error ? error.message : "Unknown error",
});

export const CombinationJobProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isCombinationsPage = pathname === "/admin/combinations";
  
  // Local state
  const abortRef = useRef(false);
  const runningRef = useRef(false);
  const progressRef = useRef<BulkProgressItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isAbortRequested, setIsAbortRequested] = useState(false);
  const [progress, setProgress] = useState<BulkProgressItem[]>([]);
  
  // Job Sync State
  const [jobId, setJobId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [dbJobStatus, setDbJobStatus] = useState<string | null>(null);

  const jobIdRef = useRef<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const doneCount = progress.filter((p) => p.status === "done").length;
  const total = progress.length;
  const hasFinished = !isRunning && (dbJobStatus === "completed" || dbJobStatus === "aborted" || dbJobStatus === "failed" || dbJobStatus === "stale");
  const allDone = hasFinished && doneCount === total && total > 0;

  // BroadcastChannel Setup
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("combination_job_sync");
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;
        if (data && typeof data === "object" && data.type === "SYNC_STATE" && data.payload) {
          if (!isOwner) { // Only spectators accept sync
            setJobId(data.payload.jobId);
            setProgress(data.payload.progress);
            setIsRunning(data.payload.isRunning);
            setDbJobStatus(data.payload.dbJobStatus);
            setIsAbortRequested(data.payload.isAbortRequested);
          }
        }
      };

      return () => {
        channel.close();
      };
    }
  }, [isOwner]);

  // Sync state from Firestore polling
  useEffect(() => {
    // 1. Owner loop handles itself, no need to poll (receives aborts via item updates)
    if (isOwner) return;

    // 2. Do not poll if we are not on the combinations page
    if (!isCombinationsPage) return;

    const fetchJob = async () => {
      const res = await getActiveCombinationJob();
      if (res.success && res.data) {
        const doc = res.data;
        setJobId(doc.id);
        setProgress(doc.items);
        
        if (doc.status === "running") {
          setIsRunning(true);
          setDbJobStatus(null);
          setIsAbortRequested(doc.abortRequested || false);
        } else {
          setIsRunning(false);
          setDbJobStatus(doc.status);
          setIsAbortRequested(false);
          runningRef.current = false;
          abortRef.current = false;
        }
      } else if (res.success && !res.data) {
        setIsRunning(false);
        setDbJobStatus(null);
        setIsAbortRequested(false);
        runningRef.current = false;
        abortRef.current = false;
      }
    };

    // 3. Fetch immediately on mount/path change
    fetchJob();

    // 4. Setup window listeners for idle/visibility updates
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchJob();
    };
    const handleFocus = () => fetchJob();

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    // 5. Poll with low frequency only if running
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(fetchJob, RUNNING_POLL_INTERVAL_MS);
    }

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      if (interval) clearInterval(interval);
    };
  }, [isOwner, isCombinationsPage, isRunning]);

  const updateItem = useCallback((index: number, patch: Partial<BulkProgressItem>) => {
    setProgress((prev) => {
      const newProgress = prev.map((item, i) => (i === index ? { ...item, ...patch } : item));
      progressRef.current = newProgress;
      if (channelRef.current && runningRef.current) {
        channelRef.current.postMessage({
          type: "SYNC_STATE",
          payload: {
            jobId: jobIdRef.current,
            progress: newProgress,
            isRunning: true,
            dbJobStatus: null,
            isAbortRequested: abortRef.current
          }
        });
      }
      return newProgress;
    });
  }, []);

  const waitWithAbort = async (ms: number) => {
    const step = 100;
    let elapsed = 0;
    while (elapsed < ms && !abortRef.current) {
      await new Promise((resolve) => setTimeout(resolve, step));
      elapsed += step;
    }
  };

  const startBulkGenerate = useCallback(async (missingItems: BulkProgressItem[]) => {
    if (missingItems.length === 0 || runningRef.current || isRunning) return;

    const startRes = await startCombinationJob(missingItems);
    if (!startRes.success) {
       return;
    }

    const newJobId = startRes.data!.id;
    setJobId(newJobId);
    jobIdRef.current = newJobId;
    setIsOwner(true);
    setDbJobStatus(null);

    runningRef.current = true;
    abortRef.current = false;
    setIsRunning(true);
    setIsAbortRequested(false);

    const initialProgress = startRes.data!.items;
    progressRef.current = initialProgress;
    setProgress(initialProgress);

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: "SYNC_STATE",
        payload: {
          jobId: newJobId,
          progress: initialProgress,
          isRunning: true,
          dbJobStatus: null,
          isAbortRequested: false
        }
      });
    }

    let hasQuotaErrorLocal = false;

    try {
      for (let i = 0; i < initialProgress.length; i++) {
        if (abortRef.current) break;

        const item = initialProgress[i];
        updateItem(i, { status: "generating" });
        
        const generatingUpdate = await updateCombinationJobItem(newJobId, i, { status: "generating" });
        if (generatingUpdate.success && generatingUpdate.data?.abortRequested) {
           abortRef.current = true;
           setIsAbortRequested(true);
           break;
        }

        try {
          const genResult = await generateCombinationContent(item.regionSlug, item.pestSlug);

          if (abortRef.current) break;

          if (!genResult.success || !genResult.data) {
            const errCode = !genResult.success ? genResult.error : "UNKNOWN_ERROR";
            updateItem(i, { status: "error", error: errCode });
            
            const errUpdate = await updateCombinationJobItem(newJobId, i, { status: "error", error: errCode });
            if (errUpdate.success && errUpdate.data?.abortRequested) {
               abortRef.current = true;
               setIsAbortRequested(true);
            }

            if (errCode === "AI_QUOTA_EXCEEDED") {
               abortRef.current = true;
               setIsAbortRequested(true);
               hasQuotaErrorLocal = true;
               break;
            }

            await waitWithAbort(RATE_LIMIT_DELAY_MS);
            continue;
          }

          const saveResult = await saveCombinationSilently(
            item.regionSlug,
            item.pestSlug,
            item.regionName,
            item.pestName,
            genResult.data
          );

          if (saveResult.success) {
            updateItem(i, { status: "done" });
            const doneUpdate = await updateCombinationJobItem(newJobId, i, { status: "done" });
            if (doneUpdate.success && doneUpdate.data?.abortRequested) {
               abortRef.current = true;
               setIsAbortRequested(true);
            }
          } else {
            updateItem(i, { status: "error", error: saveResult.error });
            const errUpdate2 = await updateCombinationJobItem(newJobId, i, { status: "error", error: saveResult.error });
            if (errUpdate2.success && errUpdate2.data?.abortRequested) {
               abortRef.current = true;
            }
          }
        } catch (itemError: unknown) {
          console.error("Unexpected error during bulk generation item", { error: getSafeErrorInfo(itemError) });
          updateItem(i, { status: "error", error: "UNEXPECTED_ERROR" });
          await updateCombinationJobItem(newJobId, i, { status: "error", error: "UNEXPECTED_ERROR" });
        }

        if (i < initialProgress.length - 1 && !abortRef.current) {
          await waitWithAbort(RATE_LIMIT_DELAY_MS);
        }
      }
      
      if (abortRef.current) {
         const finalStatus = hasQuotaErrorLocal ? "failed" : "aborted";
         await finishCombinationJob(newJobId, finalStatus);
         setDbJobStatus(finalStatus);
      } else {
         await finishCombinationJob(newJobId, "completed");
         setDbJobStatus("completed");
      }
    } catch (error: unknown) {
      console.error("Top-level error in bulk generation loop", { error: getSafeErrorInfo(error) });
      await finishCombinationJob(newJobId, "failed");
      setDbJobStatus("failed");
    } finally {
      runningRef.current = false;
      setIsRunning(false);
      setIsAbortRequested(false);
      setIsOwner(false);

      if (channelRef.current) {
        channelRef.current.postMessage({
          type: "SYNC_STATE",
          payload: {
            jobId: jobIdRef.current,
            progress: progressRef.current,
            isRunning: false,
            dbJobStatus: abortRef.current ? (hasQuotaErrorLocal ? "failed" : "aborted") : "completed",
            isAbortRequested: false
          }
        });
      }

      router.refresh();
    }
  }, [isRunning, updateItem, router]);

  const abortBulkGenerate = useCallback(async () => {
    setIsAbortRequested(true);
    if (isOwner) {
       abortRef.current = true;
    }
    if (jobId) {
       await requestAbortCombinationJob(jobId);
    }
  }, [isOwner, jobId]);

  return (
    <CombinationJobContext.Provider
      value={{
        progress,
        isRunning,
        doneCount,
        total,
        hasFinished,
        allDone,
        isOwner,
        isAbortRequested,
        startBulkGenerate,
        abortBulkGenerate,
      }}
    >
      {children}
    </CombinationJobContext.Provider>
  );
};
