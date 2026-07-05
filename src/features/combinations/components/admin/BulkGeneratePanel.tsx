"use client";

import { useMemo, useState } from "react";
import { Loader2, Sparkles, Square, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useCombinationJob } from "./CombinationJobProvider";
import { getExistingCombinationKeys } from "../../actions/bulk";
import type { RegionDoc, PestDoc } from "@/types";
import { COMBINATION_ERRORS, type BulkProgressItem, type BulkJobStatus } from "../../types";

const ICON_SIZE = 14;

type BulkGeneratePanelProps = {
  regions: RegionDoc[];
  pests: PestDoc[];
};

/** Icon and label for each bulk job status. */
const statusConfig: Record<BulkJobStatus, { icon: React.ReactNode; label: string; className: string }> = {
  pending: {
    icon: <Clock size={ICON_SIZE} aria-hidden="true" />,
    label: DICTIONARY.admin.combinations.bulkGenerate.statusPending,
    className: "text-text-muted",
  },
  generating: {
    icon: <Loader2 size={ICON_SIZE} className="animate-spin" aria-hidden="true" />,
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
 * Admin panel section for bulk-generating all missing region × pest combinations.
 * Displays missing count, starts/stops the generation run, and shows per-item progress.
 * All generated combinations are saved as active public pages.
 */
export const BulkGeneratePanel = ({ regions, pests }: BulkGeneratePanelProps) => {
  const d = DICTIONARY.admin.combinations.bulkGenerate;
  const {
    progress,
    isRunning,
    doneCount,
    total: jobTotal,
    hasFinished,
    allDone,
    isAbortRequested,
    hasStartedJobInSession,
    showToast,
    startBulkGenerate,
    abortBulkGenerate,
  } = useCombinationJob();

  const [existingKeys, setExistingKeys] = useState<Set<string> | null>(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysError, setKeysError] = useState(false);

  const missingItems = useMemo<BulkProgressItem[]>(() => {
    if (!existingKeys) return [];
    const missing: BulkProgressItem[] = [];

    for (const region of regions) {
      for (const pest of pests) {
        const id = `${region.slug}_${pest.slug}`;
        if (!existingKeys.has(id)) {
          missing.push({
            regionSlug: region.slug,
            regionName: region.name,
            pestSlug: pest.slug,
            pestName: pest.name,
            status: "pending",
          });
        }
      }
    }
    return missing;
  }, [regions, pests, existingKeys]);

  const total = isRunning || hasFinished ? jobTotal : missingItems.length;

  const shouldShowJobResult = hasStartedJobInSession && hasFinished;
  const hasQuotaError = shouldShowJobResult && progress.some((p) => p.error === COMBINATION_ERRORS.AI_QUOTA_EXCEEDED);
  const hasProviderUnavailableError = shouldShowJobResult && progress.some((p) => p.error === COMBINATION_ERRORS.AI_PROVIDER_UNAVAILABLE);

  const statusText = isRunning
    ? isAbortRequested
      ? d.stoppingStatus.replace("{done}", String(doneCount)).replace("{total}", String(total))
      : d.running.replace("{done}", String(doneCount)).replace("{total}", String(total))
    : null;

  const activeProgress = isRunning ? progress : [];

  const progressStyle = { width: total > 0 ? `${(doneCount / total) * 100}%` : "0%" };

  const handleStart = async () => {
    let currentKeys = existingKeys;

    if (!currentKeys) {
      setKeysLoading(true);
      setKeysError(false);
      const res = await getExistingCombinationKeys();
      setKeysLoading(false);

      if (res.success && res.data) {
        currentKeys = new Set(res.data);
        setExistingKeys(currentKeys);
      } else {
        setKeysError(true);
        showToast({
          variant: "error",
          message: DICTIONARY.admin.combinations.errorDefault,
        });
        return;
      }
    }

    const missing: BulkProgressItem[] = [];
    for (const region of regions) {
      for (const pest of pests) {
        const id = `${region.slug}_${pest.slug}`;
        if (!currentKeys.has(id)) {
          missing.push({
            regionSlug: region.slug,
            regionName: region.name,
            pestSlug: pest.slug,
            pestName: pest.name,
            status: "pending",
          });
        }
      }
    }

    if (missing.length === 0) {
      return;
    }

    startBulkGenerate(missing);
  };

  return (
    <section
      aria-labelledby="bulk-generate-heading"
      className="bg-brand-surface border border-brand-border rounded-brand-lg p-6 space-y-5"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2
            id="bulk-generate-heading"
            className="font-heading font-bold text-text-primary text-lg"
          >
            {d.title}
          </h2>
          <p className="text-text-muted text-sm mt-1">{d.description}</p>
        </div>

        {!isRunning && !hasFinished && (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-neutral border border-brand-border text-text-secondary">
            {keysLoading
              ? DICTIONARY.global.loading
              : keysError
                ? DICTIONARY.admin.combinations.errorDefault
                : !existingKeys
                  ? d.calculateRequired
                  : missingItems.length === 0
                    ? d.noMissing
                    : d.missingCount.replace("{count}", String(missingItems.length))}
          </span>
        )}

        {isRunning && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-neutral border border-brand-border text-brand-primary">
            <Loader2 size={12} className="animate-spin" aria-hidden="true" />
            {statusText}
          </span>
        )}
      </div>

      {isRunning && total > 0 && (
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

      {existingKeys !== null && missingItems.length === 0 && !keysLoading && !keysError && !isRunning && !hasFinished && (
        <Alert variant="info" message={d.noMissing} />
      )}

      {keysError && (
        <Alert variant="error" message={DICTIONARY.admin.combinations.errorDefault} />
      )}

      {shouldShowJobResult && allDone && (
        <Alert variant="success" message={`${d.doneAll} ${d.draftNote}`} />
      )}

      {shouldShowJobResult && hasFinished && !allDone && !hasQuotaError && !hasProviderUnavailableError && (
        <Alert
          variant="info"
          message={`${d.partialDone.replace("{done}", String(doneCount)).replace("{total}", String(progress.length))} ${d.draftNote}`}
        />
      )}

      {hasQuotaError && (
        <Alert
          variant="error"
          message={d.errorQuotaExceeded}
        />
      )}

      {hasProviderUnavailableError && (
        <Alert
          variant="error"
          message={d.errorProviderUnavailable}
        />
      )}

      {activeProgress.length > 0 && (
        <ul className="divide-y divide-brand-border/40 rounded-xl border border-brand-border/60 overflow-hidden max-h-72 overflow-y-auto">
          {activeProgress.map((item) => {
            const cfg = statusConfig[item.status];
            return (
              <li
                key={`${item.regionSlug}_${item.pestSlug}`}
                className="flex flex-col items-start justify-between gap-1.5 px-4 py-3 text-sm bg-brand-surface sm:flex-row sm:items-center sm:gap-3"
              >
                <span className="text-text-primary font-medium break-words">
                  {item.regionName} — {item.pestName}
                </span>
                <span className={`inline-flex items-center gap-1.5 font-medium ${cfg.className}`}>
                  {cfg.icon}
                  {cfg.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {(!existingKeys || missingItems.length > 0) && (
        <div className="flex items-center gap-3 flex-wrap">
          {!isRunning ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleStart}
              disabled={keysLoading || keysError || (existingKeys !== null && missingItems.length === 0)}
              id="bulk-generate-start-btn"
            >
              <Sparkles size={ICON_SIZE} aria-hidden="true" />
              {keysLoading ? DICTIONARY.global.loading : d.startBtn}
              {existingKeys && missingItems.length > 0 && !keysLoading && !keysError && (
                <span className="ml-1 opacity-75">({missingItems.length})</span>
              )}
            </Button>
          ) : (
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
              {isAbortRequested ? d.stoppingBtn : d.stopBtn}
            </Button>
          )}
        </div>
      )}
    </section>
  );
};
