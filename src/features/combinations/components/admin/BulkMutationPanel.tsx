"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Loader2,
  PowerOff,
  ShieldAlert,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { cn } from "@/utils/cn";
import { bulkMutateCombinationsByFilter } from "../../actions";
import { getExistingCombinationKeys } from "../../actions/bulk";
import type { PestDoc, RegionDoc } from "@/types";
import type { BulkCombinationMutationOperation } from "../../types";
import { useCombinationJob } from "./CombinationJobProvider";
import { resolveAdminActionError } from "@/features/auth/adminActionError";

type BulkMutationPanelProps = {
  regions: RegionDoc[];
  pests: PestDoc[];
};

const ICON_SIZE = 16;

type CombinationPair = {
  regionSlug: string;
  pestSlug: string;
};

type OperationTone = {
  icon: LucideIcon;
  accentClassName: string;
  buttonClassName: string;
  confirmButtonClassName: string;
};

const OPERATION_TONES: Record<BulkCombinationMutationOperation, OperationTone> = {
  deactivate: {
    icon: PowerOff,
    accentClassName: "border-brand-border bg-surface-neutral text-text-secondary",
    buttonClassName:
      "border-brand-border bg-surface-neutral text-text-secondary hover:bg-brand-surface-muted hover:text-text-primary",
    confirmButtonClassName:
      "border-brand-border bg-surface-neutral text-text-secondary hover:bg-brand-surface-muted hover:text-text-primary",
  },
  archive: {
    icon: Archive,
    accentClassName: "border-warning-border bg-warning-bg/60 text-warning-text",
    buttonClassName:
      "border-warning-border bg-warning-bg/50 text-warning-text hover:bg-warning-hover/70 hover:text-warning-text",
    confirmButtonClassName:
      "border-warning-border bg-warning-bg/70 text-warning-text hover:bg-warning-hover hover:text-warning-text",
  },
  restore: {
    icon: ArchiveRestore,
    accentClassName: "border-success-border bg-success-bg/60 text-success-text",
    buttonClassName:
      "border-success-border bg-success-bg/50 text-success-text hover:bg-success-bg/80 hover:text-success-text",
    confirmButtonClassName:
      "border-success-border bg-success-bg/70 text-success-text hover:bg-success-bg/80 hover:text-success-text",
  },
  delete: {
    icon: Trash2,
    accentClassName: "border-error-border bg-error-bg/60 text-error-text",
    buttonClassName:
      "border-error-border bg-error-bg text-error-text hover:bg-error-bg/80 hover:text-error-text",
    confirmButtonClassName:
      "border-error-border bg-error-bg text-error-text hover:bg-error-bg/80 hover:text-error-text",
  },
};

const parseCombinationKey = (key: string): CombinationPair | null => {
  const separatorIndex = key.indexOf("_");

  if (separatorIndex <= 0 || separatorIndex === key.length - 1) {
    return null;
  }

  return {
    regionSlug: key.slice(0, separatorIndex),
    pestSlug: key.slice(separatorIndex + 1),
  };
};

export const BulkMutationPanel = ({ regions, pests }: BulkMutationPanelProps) => {
  const d = DICTIONARY.admin.combinations.bulkMutation;
  const { showToast, notifyBulkMutation } = useCombinationJob();

  const [regionSlug, setRegionSlug] = useState("");
  const [pestSlug, setPestSlug] = useState("");
  const [operation, setOperation] = useState<BulkCombinationMutationOperation>("archive");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [combinationPairs, setCombinationPairs] = useState<CombinationPair[]>([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [hasOptionsError, setHasOptionsError] = useState(false);

  const selectedRegionName = regions.find((region) => region.slug === regionSlug)?.name || regionSlug;
  const selectedPestName = pests.find((pest) => pest.slug === pestSlug)?.name || pestSlug;
  const hasFilter = !!regionSlug || !!pestSlug;
  const isDelete = operation === "delete";
  const operationTone = OPERATION_TONES[operation];
  const OperationIcon = operationTone.icon;

  const operationLabel = d.operations[operation];
  const hasAnyCombinationOption = combinationPairs.length > 0;

  useEffect(() => {
    let isMounted = true;

    const loadCombinationKeys = async () => {
      setIsOptionsLoading(true);
      setHasOptionsError(false);

      try {
        const result = await getExistingCombinationKeys();

        if (!isMounted) return;

        setIsOptionsLoading(false);

        if (!result.success) {
          setHasOptionsError(true);
          setCombinationPairs([]);
          return;
        }

        const pairsByKey = new Map<string, CombinationPair>();
        (result.data ?? []).forEach((key) => {
          const pair = parseCombinationKey(key);

          if (pair) {
            pairsByKey.set(`${pair.regionSlug}_${pair.pestSlug}`, pair);
          }
        });

        setCombinationPairs([...pairsByKey.values()]);
      } catch {
        if (!isMounted) return;

        setIsOptionsLoading(false);
        setHasOptionsError(true);
        setCombinationPairs([]);
      }
    };

    void loadCombinationKeys();

    return () => {
      isMounted = false;
    };
  }, []);

  const availableRegionSlugs = useMemo(() => {
    const slugs = new Set<string>();

    combinationPairs.forEach((pair) => {
      if (!pestSlug || pair.pestSlug === pestSlug) {
        slugs.add(pair.regionSlug);
      }
    });

    return slugs;
  }, [combinationPairs, pestSlug]);

  const availablePestSlugs = useMemo(() => {
    const slugs = new Set<string>();

    combinationPairs.forEach((pair) => {
      if (!regionSlug || pair.regionSlug === regionSlug) {
        slugs.add(pair.pestSlug);
      }
    });

    return slugs;
  }, [combinationPairs, regionSlug]);

  const regionOptions = useMemo(
    () => [
      { value: "", label: d.regionPlaceholder },
      ...regions
        .filter((region) => availableRegionSlugs.has(region.slug))
        .map((region) => ({ value: region.slug, label: region.name })),
    ],
    [availableRegionSlugs, d.regionPlaceholder, regions],
  );

  const pestOptions = useMemo(
    () => [
      { value: "", label: d.pestPlaceholder },
      ...pests
        .filter((pest) => availablePestSlugs.has(pest.slug))
        .map((pest) => ({ value: pest.slug, label: pest.name })),
    ],
    [availablePestSlugs, d.pestPlaceholder, pests],
  );

  const scopeLabel = useMemo(() => {
    if (regionSlug && pestSlug) {
      return d.scopeRegionPest
        .replace("{region}", selectedRegionName)
        .replace("{pest}", selectedPestName);
    }

    if (regionSlug) {
      return d.scopeRegion.replace("{region}", selectedRegionName);
    }

    if (pestSlug) {
      return d.scopePest.replace("{pest}", selectedPestName);
    }

    return d.scopeNone;
  }, [d.scopeNone, d.scopePest, d.scopeRegion, d.scopeRegionPest, pestSlug, regionSlug, selectedPestName, selectedRegionName]);

  const confirmDescription = d.confirmDescription
    .replace("{operation}", operationLabel)
    .replace("{scope}", scopeLabel);
  const statusLabel = isOptionsLoading
    ? d.optionsLoading
    : hasOptionsError
      ? d.optionsError
      : hasAnyCombinationOption
        ? scopeLabel
        : d.noOptions;
  const canOpenConfirm = hasFilter && !isMutating && !isOptionsLoading && !hasOptionsError && hasAnyCombinationOption;

  const handleOpenConfirm = () => {
    if (!hasFilter) {
      showToast({ variant: "warning", message: d.errorNoFilter });
      return;
    }

    if (!canOpenConfirm) return;

    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!hasFilter || isMutating) return;

    setIsMutating(true);
    const result = await bulkMutateCombinationsByFilter({
      regionSlug: regionSlug || undefined,
      pestSlug: pestSlug || undefined,
      operation,
    });
    setIsMutating(false);
    setIsConfirmOpen(false);

    if (result.success) {
      const count = result.data?.affectedCount ?? 0;
      notifyBulkMutation({
        operation,
        affectedKeys: result.data?.affectedKeys ?? result.data?.restoredKeys ?? [],
        affectedRows: result.data?.affectedRows ?? [],
      });

      if (result.data?.activationStatus === "deferred") {
        showToast({
          variant: "warning",
          message: result.data?.publicationRequired
            ? DICTIONARY.admin.publicPublicationRequiredWarning
            : DICTIONARY.admin.publicActivationDeferredWarning,
        });
        return;
      }

      if (operation === "restore") {
        const skippedCount = result.data?.skippedCount ?? 0;

        if (count > 0 && skippedCount > 0) {
          showToast({
            variant: "warning",
            message: d.restorePartial,
          });
        } else if (count > 0) {
          showToast({
            variant: "success",
            message: d.restoreSuccess.replace("{count}", String(count)),
          });
        } else {
          showToast({
            variant: "warning",
            message: d.restoreNoneEligible,
          });
        }
      } else {
        showToast({
          variant: "success",
          message: d.success.replace("{count}", String(count)),
        });
      }

      return;
    }

    if (result.error === "BULK_NO_MATCH") {
      showToast({ variant: "info", message: d.errorNoMatch });
      return;
    }

    if (result.error === "BULK_NO_FILTER") {
      showToast({ variant: "warning", message: d.errorNoFilter });
      return;
    }

    showToast({
      variant: "error",
      message: resolveAdminActionError(result, d.errorDefault),
    });
  };

  return (
    <section
      aria-labelledby="bulk-mutation-heading"
      className="bg-brand-surface border border-brand-border rounded-brand-lg p-4 space-y-5 sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2
            id="bulk-mutation-heading"
            className="font-heading font-bold text-text-primary text-lg"
          >
            {d.title}
          </h2>
          <p className="text-text-muted text-sm mt-1">{d.description}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand-border bg-surface-neutral px-2.5 py-1 text-xs font-semibold text-text-secondary">
          <ShieldAlert size={14} aria-hidden="true" />
          {d.badge}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Select
          id="bulk-mutation-region"
          name="bulkMutationRegion"
          label={d.regionLabel}
          placeholder={d.regionPlaceholder}
          value={regionSlug}
          onChange={setRegionSlug}
          options={regionOptions}
        />
        <Select
          id="bulk-mutation-pest"
          name="bulkMutationPest"
          label={d.pestLabel}
          placeholder={d.pestPlaceholder}
          value={pestSlug}
          onChange={setPestSlug}
          options={pestOptions}
        />
        <Select
          id="bulk-mutation-operation"
          name="bulkMutationOperation"
          label={d.operationLabel}
          value={operation}
          onChange={(value) => setOperation(value as BulkCombinationMutationOperation)}
          options={[
            { value: "deactivate", label: d.operations.deactivate },
            { value: "archive", label: d.operations.archive },
            { value: "restore", label: d.operations.restore },
            { value: "delete", label: d.operations.delete },
          ]}
        />
      </div>

      <div
        className={cn(
          "rounded-brand-md border px-3 py-2 text-sm",
          operationTone.accentClassName,
        )}
      >
        <div className="flex items-start gap-2">
          <OperationIcon size={ICON_SIZE} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 space-y-0.5">
            <p className="font-semibold">{operationLabel}</p>
            <p className="leading-relaxed">{d.operationDescriptions[operation]}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-brand-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className={cn("text-sm", hasOptionsError ? "text-error-text" : "text-text-secondary")}>
          {statusLabel}
        </p>
        <Button
          type="button"
          variant={isDelete ? "danger" : "outline"}
          onClick={handleOpenConfirm}
          disabled={!canOpenConfirm}
          className={cn("w-full sm:w-auto", operationTone.buttonClassName)}
        >
          {isMutating ? (
            <>
              <Loader2 size={ICON_SIZE} className="animate-spin" aria-hidden="true" />
              {d.processing}
            </>
          ) : (
            <>
              <AlertTriangle size={ICON_SIZE} aria-hidden="true" />
              {d.openConfirm}
            </>
          )}
        </Button>
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={d.confirmTitles[operation]}
        className="h-auto max-w-md"
        bodyClassName="flex-none grow-0 shrink-0 basis-auto overflow-visible p-4 sm:p-4"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-text-secondary">
            {confirmDescription}
          </p>
          <div
            className={cn(
              "rounded-brand-md border px-3 py-2 text-sm",
              operationTone.accentClassName,
            )}
          >
            <div className="flex items-start gap-2">
              <OperationIcon size={ICON_SIZE} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 space-y-0.5">
                <p className="font-semibold">{operationLabel}</p>
                <p className="leading-relaxed">{d.operationDescriptions[operation]}</p>
              </div>
            </div>
          </div>
          {isDelete && (
            <p className="rounded-brand-md border border-error-border bg-error-bg/60 px-3 py-2 text-sm text-error-text">
              {d.deleteWarning}
            </p>
          )}
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isMutating}
              className="w-full sm:w-auto"
            >
              {DICTIONARY.global.ui.cancel}
            </Button>
            <Button
              type="button"
              variant={isDelete ? "danger" : "outline"}
              onClick={handleConfirm}
              disabled={isMutating}
              className={cn("w-full sm:w-auto", operationTone.confirmButtonClassName)}
            >
              {isMutating ? DICTIONARY.global.loading : d.confirmButton}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};
