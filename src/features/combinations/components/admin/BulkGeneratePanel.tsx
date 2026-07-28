"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Square,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { DICTIONARY } from "@/constants/dictionary";
import type { PestDoc, RegionDoc } from "@/types";
import { getExistingCombinationKeys } from "../../actions/bulk";
import {
  COMBINATION_ERRORS,
  type BulkJobInputItem,
  type BulkJobStatus,
} from "../../types";
import { useCombinationJob } from "./CombinationJobProvider";

const ICON_SIZE = 14;

type BulkGeneratePanelProps = {
  regions: RegionDoc[];
  pests: PestDoc[];
};

type ExistingKeysLoadResult =
  | { status: "success"; keys: Set<string> }
  | { status: "error" }
  | { status: "cancelled" };

const STATUS_CONFIG: Record<
  BulkJobStatus,
  { icon: React.ReactNode; label: string; className: string }
> = {
  pending: {
    icon: <Clock size={ICON_SIZE} aria-hidden="true" />,
    label: DICTIONARY.admin.combinations.bulkGenerate.statusPending,
    className: "text-text-muted",
  },
  generating: {
    icon: (
      <Loader2
        size={ICON_SIZE}
        className="animate-spin"
        aria-hidden="true"
      />
    ),
    label: DICTIONARY.admin.combinations.bulkGenerate.statusGenerating,
    className: "text-brand-primary",
  },
  done: {
    icon: <CheckCircle2 size={ICON_SIZE} aria-hidden="true" />,
    label: DICTIONARY.admin.combinations.bulkGenerate.statusDone,
    className: "text-success-text",
  },
  error: {
    icon: <AlertCircle size={ICON_SIZE} aria-hidden="true" />,
    label: DICTIONARY.admin.combinations.bulkGenerate.statusError,
    className: "text-error-text",
  },
};

/**
 * Starts and monitors GitHub-backed bulk generation without running AI in-browser.
 *
 * @param regions - Active region options
 * @param pests - Active pest options
 */
export const BulkGeneratePanel = ({
  regions,
  pests,
}: BulkGeneratePanelProps) => {
  const dictionary = DICTIONARY.admin.combinations.bulkGenerate;
  const {
    progress,
    jobStatus,
    isRunning,
    doneCount,
    total: jobTotal,
    allDone,
    isAbortRequested,
    failedIndex,
    failureCode,
    showToast,
    startBulkGenerate,
    abortBulkGenerate,
  } = useCombinationJob();
  const [existingKeys, setExistingKeys] = useState<Set<string> | null>(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysError, setKeysError] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const isMountedRef = useRef(true);
  const startPendingRef = useRef(false);

  const loadExistingKeys =
    useCallback(async (): Promise<ExistingKeysLoadResult> => {
      setKeysLoading(true);
      setKeysError(false);

      try {
        const response = await getExistingCombinationKeys();
        if (!isMountedRef.current) return { status: "cancelled" };

        if (!response.success || !response.data) {
          setKeysError(true);
          return { status: "error" };
        }

        const keys = new Set(response.data);
        setExistingKeys(keys);
        return { status: "success", keys };
      } catch {
        if (!isMountedRef.current) return { status: "cancelled" };
        setKeysError(true);
        return { status: "error" };
      } finally {
        if (isMountedRef.current) setKeysLoading(false);
      }
    }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const refreshTimer = setTimeout(() => void loadExistingKeys(), 0);
    return () => clearTimeout(refreshTimer);
  }, [loadExistingKeys]);

  useEffect(() => {
    if (
      jobStatus !== "completed" &&
      jobStatus !== "failed" &&
      jobStatus !== "aborted" &&
      jobStatus !== "stale"
    ) {
      return;
    }
    const refreshTimer = setTimeout(() => void loadExistingKeys(), 0);
    return () => clearTimeout(refreshTimer);
  }, [jobStatus, loadExistingKeys]);

  const missingItems = useMemo<BulkJobInputItem[]>(() => {
    if (!existingKeys) return [];
    const missing: BulkJobInputItem[] = [];
    regions.forEach((region) => {
      pests.forEach((pest) => {
        if (!existingKeys.has(`${region.slug}_${pest.slug}`)) {
          missing.push({
            regionSlug: region.slug,
            regionName: region.name,
            pestSlug: pest.slug,
            pestName: pest.name,
          });
        }
      });
    });
    return missing;
  }, [existingKeys, pests, regions]);

  const total = jobStatus ? jobTotal : missingItems.length;
  const progressStyle = {
    width: total > 0 ? `${(doneCount / total) * 100}%` : "0%",
  };
  const failedItem =
    failedIndex !== undefined
      ? progress[failedIndex]
      : progress.find((item) => item.status === "error");
  const failedItemName = failedItem
    ? `${failedItem.regionName} — ${failedItem.pestName}`
    : dictionary.failedUnknownItem;
  const failedSummary = failedItem
    ? dictionary.failedSummary
        .replace("{item}", failedItemName)
        .replace("{done}", String(doneCount))
        .replace("{total}", String(jobTotal))
    : dictionary.failedBeforeWorker;
  const failureDetail =
    failureCode === COMBINATION_ERRORS.AI_QUOTA_EXCEEDED
      ? dictionary.errorQuotaExceeded
      : failureCode === COMBINATION_ERRORS.AI_PROVIDER_UNAVAILABLE
        ? dictionary.errorProviderUnavailable
        : "";

  const activeStatusText =
    jobStatus === "queued"
      ? dictionary.queuedStatus
      : isAbortRequested
        ? dictionary.stoppingStatus
            .replace("{done}", String(doneCount))
            .replace("{total}", String(jobTotal))
        : dictionary.running
            .replace("{done}", String(doneCount))
            .replace("{total}", String(jobTotal));
  const isButtonBusy = isStarting || keysLoading;

  const handleStart = async () => {
    if (startPendingRef.current || isRunning) return;

    startPendingRef.current = true;
    setIsStarting(true);

    try {
      const keysResult: ExistingKeysLoadResult = existingKeys
        ? { status: "success", keys: existingKeys }
        : await loadExistingKeys();
      if (keysResult.status === "cancelled" || !isMountedRef.current) return;
      if (keysResult.status === "error") {
        showToast({
          variant: "error",
          message: DICTIONARY.admin.combinations.errorDefault,
        });
        return;
      }

      const missing: BulkJobInputItem[] = [];
      regions.forEach((region) => {
        pests.forEach((pest) => {
          if (!keysResult.keys.has(`${region.slug}_${pest.slug}`)) {
            missing.push({
              regionSlug: region.slug,
              regionName: region.name,
              pestSlug: pest.slug,
              pestName: pest.name,
            });
          }
        });
      });
      if (missing.length > 0 && isMountedRef.current) {
        await startBulkGenerate(missing);
      }
    } catch {
      if (isMountedRef.current) {
        showToast({
          variant: "error",
          message: DICTIONARY.admin.combinations.errorDefault,
        });
      }
    } finally {
      startPendingRef.current = false;
      if (isMountedRef.current) setIsStarting(false);
    }
  };

  return (
    <section
      aria-labelledby="bulk-generate-heading"
      className="bg-brand-surface border border-brand-border rounded-brand-lg p-6 space-y-5"
    >
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2
            id="bulk-generate-heading"
            className="font-heading font-bold text-text-primary text-lg"
          >
            {dictionary.title}
          </h2>
          <p className="text-text-muted text-sm mt-1">
            {dictionary.description}
          </p>
        </div>

        {isRunning ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-neutral border border-brand-border text-brand-primary">
            <Loader2
              size={12}
              className="animate-spin"
              aria-hidden="true"
            />
            {activeStatusText}
          </span>
        ) : (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-neutral border border-brand-border text-text-secondary">
            {keysLoading
              ? DICTIONARY.global.loading
              : keysError
                ? DICTIONARY.admin.combinations.errorDefault
                : !existingKeys
                  ? dictionary.calculateRequired
                  : missingItems.length === 0
                    ? dictionary.noMissing
                    : dictionary.missingCount.replace(
                        "{count}",
                        String(missingItems.length),
                      )}
          </span>
        )}
      </header>

      {isRunning && (
        <Alert
          variant="info"
          message={
            jobStatus === "queued"
              ? `${dictionary.waitingWorker} ${dictionary.backgroundNote}`
              : dictionary.backgroundNote
          }
        />
      )}

      {(isRunning || jobStatus === "completed" || jobStatus === "failed") &&
        total > 0 && (
          <div
            role="progressbar"
            aria-valuenow={doneCount}
            aria-valuemin={0}
            aria-valuemax={total}
            className="h-2 bg-surface-neutral rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-brand-primary rounded-full transition-all duration-500"
              style={progressStyle}
            />
          </div>
        )}

      {allDone && (
        <Alert
          variant="success"
          message={`${dictionary.doneAll} ${dictionary.draftNote}`}
        />
      )}
      {jobStatus === "failed" && (
        <Alert
          variant="error"
          message={`${failedSummary}${failureDetail ? ` ${failureDetail}` : ""} ${dictionary.restartNote}`}
        />
      )}
      {jobStatus === "aborted" && (
        <Alert
          variant="info"
          message={dictionary.abortedSummary
            .replace("{done}", String(doneCount))
            .replace("{total}", String(jobTotal))}
        />
      )}
      {jobStatus === "stale" && (
        <Alert
          variant="error"
          message={dictionary.staleSummary
            .replace("{done}", String(doneCount))
            .replace("{total}", String(jobTotal))}
        />
      )}
      {!isRunning &&
        existingKeys !== null &&
        missingItems.length === 0 &&
        !keysLoading &&
        !keysError &&
        jobStatus !== "completed" && (
          <Alert variant="info" message={dictionary.noMissing} />
        )}
      {keysError && (
        <Alert
          variant="error"
          message={DICTIONARY.admin.combinations.errorDefault}
        />
      )}

      {progress.length > 0 && (
        <ul className="divide-y divide-brand-border/40 rounded-xl border border-brand-border/60 overflow-hidden max-h-72 overflow-y-auto">
          {progress.map((item) => {
            const config = STATUS_CONFIG[item.status];
            return (
              <li
                key={`${item.regionSlug}_${item.pestSlug}`}
                className="flex flex-col items-start justify-between gap-1.5 px-4 py-3 text-sm bg-brand-surface sm:flex-row sm:items-center sm:gap-3"
              >
                <span className="text-text-primary font-medium break-words">
                  {item.regionName} — {item.pestName}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 font-medium ${config.className}`}
                >
                  {config.icon}
                  {config.label}
                  {item.attemptCount > 0 && item.status !== "done"
                    ? ` (${dictionary.attemptProgress.replace("{attempt}", String(item.attemptCount)).replace("{max}", String(dictionary.maxAttempts))})`
                    : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {isRunning ? (
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={abortBulkGenerate}
            disabled={isAbortRequested}
            id="bulk-generate-stop-btn"
            className="border border-error-border bg-error-bg/30 text-error-text shadow-none hover:bg-error-bg/60 hover:text-error-text disabled:opacity-60"
          >
            <Square size={ICON_SIZE} aria-hidden="true" />
            {isAbortRequested ? dictionary.stoppingBtn : dictionary.stopBtn}
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleStart}
            disabled={
              isButtonBusy ||
              keysError ||
              (existingKeys !== null && missingItems.length === 0)
            }
            aria-busy={isButtonBusy}
            id="bulk-generate-start-btn"
            className="min-w-52 whitespace-nowrap"
          >
            {isStarting ? (
              <Loader2
                size={ICON_SIZE}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Sparkles size={ICON_SIZE} aria-hidden="true" />
            )}
            {isStarting
              ? dictionary.statusGenerating
              : keysLoading
                ? DICTIONARY.global.loading
                : dictionary.startBtn}
            {existingKeys &&
              missingItems.length > 0 &&
              !keysLoading &&
              !isStarting && (
                <span className="ml-1 opacity-75">
                  ({missingItems.length})
                </span>
              )}
          </Button>
        )}
      </div>
    </section>
  );
};
