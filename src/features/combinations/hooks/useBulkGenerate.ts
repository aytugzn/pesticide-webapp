"use client";

import { useState, useCallback, useRef } from "react";
import { generateCombinationContent, saveCombinationSilently } from "../actions";
import type { RegionDoc, PestDoc } from "@/types";
import type { BulkProgressItem, CombinationRow } from "../types";

/** Delay between successive Gemini API calls to stay within free-tier RPM limits. */
const RATE_LIMIT_DELAY_MS = 1500;

type UseBulkGenerateOptions = {
  regions: RegionDoc[];
  pests: PestDoc[];
  existingRows: CombinationRow[];
  onComplete: () => void;
};

export type UseBulkGenerateReturn = {
  missingItems: BulkProgressItem[];
  progress: BulkProgressItem[];
  isRunning: boolean;
  doneCount: number;
  start: () => Promise<void>;
  abort: () => void;
};

/**
 * Manages the bulk combination generation workflow.
 *
 * Calculates which region × pest pairs are missing from Firestore,
 * then generates and silently saves them one-by-one using Gemini AI.
 * Combinations are saved as drafts (isActive: false) and can be activated individually by the admin.
 *
 * @param regions - All active regions
 * @param pests - All active pests
 * @param existingRows - Already-saved combinations (used to calculate missing pairs)
 * @param onComplete - Called when the entire run finishes or is aborted
 */
export const useBulkGenerate = ({
  regions,
  pests,
  existingRows,
  onComplete,
}: UseBulkGenerateOptions): UseBulkGenerateReturn => {
  const abortRef = useRef(false);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<BulkProgressItem[]>([]);

  /** Computes region × pest pairs that have no saved combination yet. */
  const existingIds = new Set(existingRows.map((r) => `${r.region}_${r.pest}`));
  const missingItems: BulkProgressItem[] = [];

  for (const region of regions) {
    for (const pest of pests) {
      const id = `${region.slug}_${pest.slug}`;
      if (!existingIds.has(id)) {
        missingItems.push({
          regionSlug: region.slug,
          regionName: region.name,
          pestSlug: pest.slug,
          pestName: pest.name,
          status: "pending",
        });
      }
    }
  }

  const doneCount = progress.filter((p) => p.status === "done").length;

  /** Updates a single item's status in the progress list by its index. */
  const updateItem = useCallback(
    (index: number, patch: Partial<BulkProgressItem>) => {
      setProgress((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  /**
   * Starts the bulk generation run.
   * Iterates over all missing pairs sequentially, generating and saving each one.
   * Aborts early if the user calls abort().
   */
  const start = useCallback(async () => {
    if (missingItems.length === 0) return;

    abortRef.current = false;
    setIsRunning(true);

    // Initialise progress list with all missing items in "pending" state
    const initialProgress: BulkProgressItem[] = missingItems.map((item) => ({
      ...item,
      status: "pending",
    }));
    setProgress(initialProgress);

    for (let i = 0; i < initialProgress.length; i++) {
      if (abortRef.current) break;

      const item = initialProgress[i];
      updateItem(i, { status: "generating" });

      // 1. Generate content via Gemini
      const genResult = await generateCombinationContent(item.regionSlug, item.pestSlug);

      if (abortRef.current) break;

      if (!genResult.success || !genResult.data) {
        const errCode = !genResult.success ? genResult.error : undefined;
        updateItem(i, { status: "error", error: errCode });
        // Wait before continuing even on error to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
        continue;
      }

      // 2. Save silently (no updateTag) as draft (isActive: false)
      const saveResult = await saveCombinationSilently(
        item.regionSlug,
        item.pestSlug,
        item.regionName,
        item.pestName,
        genResult.data
      );

      if (saveResult.success) {
        updateItem(i, { status: "done" });
      } else {
        updateItem(i, { status: "error", error: saveResult.error });
      }

      // Rate-limit delay before the next pair (skip after the last item)
      if (i < initialProgress.length - 1 && !abortRef.current) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
      }
    }

    setIsRunning(false);
    onComplete();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingItems.length, updateItem, onComplete]);

  /** Signals the running loop to stop after the current item finishes. */
  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return {
    missingItems,
    progress,
    isRunning,
    doneCount,
    start,
    abort,
  };
};
