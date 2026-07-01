"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Square, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useBulkGenerate } from "../../hooks/useBulkGenerate";
import type { RegionDoc, PestDoc } from "@/types";
import type { CombinationRow, BulkJobStatus } from "../../types";

const ICON_SIZE = 14;

type BulkGeneratePanelProps = {
  regions: RegionDoc[];
  pests: PestDoc[];
  existingRows: CombinationRow[];
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
 * All generated combinations are saved as drafts (isActive: false).
 */
export const BulkGeneratePanel = ({ regions, pests, existingRows }: BulkGeneratePanelProps) => {
  const d = DICTIONARY.admin.combinations.bulkGenerate;
  const router = useRouter();

  const handleComplete = useCallback(() => {
    router.refresh();
  }, [router]);

  const { missingItems, progress, isRunning, doneCount, start, abort } = useBulkGenerate({
    regions,
    pests,
    existingRows,
    onComplete: handleComplete,
  });

  const total = isRunning ? progress.length : missingItems.length;
  const hasFinished = !isRunning && progress.length > 0;
  const allDone = hasFinished && doneCount === progress.length;

  const statusText = isRunning
    ? d.running.replace("{done}", String(doneCount)).replace("{total}", String(total))
    : null;

  const activeProgress = isRunning ? progress : [];

  const progressStyle = { width: `${(doneCount / total) * 100}%` };

  return (
    <section
      aria-labelledby="bulk-generate-heading"
      className="bg-brand-surface border border-brand-border rounded-brand-lg p-6 space-y-5"
    >
      {/* Header */}
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

        {/* Count badge */}
        {!isRunning && !hasFinished && (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-neutral border border-brand-border text-text-secondary">
            {missingItems.length === 0
              ? d.noMissing
              : d.missingCount.replace("{count}", String(missingItems.length))}
          </span>
        )}

        {/* Running status text */}
        {isRunning && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-neutral border border-brand-border text-brand-primary">
            <Loader2 size={12} className="animate-spin" aria-hidden="true" />
            {statusText}
          </span>
        )}
      </div>

      {/* Progress bar */}
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

      {/* Empty state */}
      {missingItems.length === 0 && !isRunning && !hasFinished && (
        <Alert variant="info" message={d.noMissing} />
      )}

      {/* All done state */}
      {allDone && (
        <Alert variant="success" message={`${d.doneAll} ${d.draftNote}`} />
      )}

      {/* Partially done / aborted state */}
      {hasFinished && !allDone && (
        <Alert
          variant="info"
          message={`${doneCount}/${progress.length} kombinasyon üretildi. ${d.draftNote}`}
        />
      )}

      {/* Per-item progress list (shown while running) */}
      {activeProgress.length > 0 && (
        <ul className="divide-y divide-brand-border/40 rounded-xl border border-brand-border/60 overflow-hidden max-h-72 overflow-y-auto">
          {activeProgress.map((item) => {
            const cfg = statusConfig[item.status];
            return (
              <li
                key={`${item.regionSlug}_${item.pestSlug}`}
                className="flex items-center justify-between px-4 py-2.5 text-sm bg-brand-surface"
              >
                <span className="text-text-primary font-medium">
                  {item.regionName} — {item.pestName}
                </span>
                <span className={`inline-flex items-center gap-1.5 font-medium ${cfg.className}`}>
                  {cfg.icon}
                  {item.error ? `${cfg.label}: ${item.error}` : cfg.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Action buttons */}
      {missingItems.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {!isRunning ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={start}
              disabled={missingItems.length === 0}
              id="bulk-generate-start-btn"
            >
              <Sparkles size={ICON_SIZE} aria-hidden="true" />
              {d.startBtn}
              {missingItems.length > 0 && (
                <span className="ml-1 opacity-75">({missingItems.length})</span>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={abort}
              id="bulk-generate-stop-btn"
            >
              <Square size={ICON_SIZE} aria-hidden="true" />
              {d.stopBtn}
            </Button>
          )}
        </div>
      )}
    </section>
  );
};
