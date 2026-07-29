"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { generateCombinationContent } from "../actions/ai";
import { saveCombination } from "../actions";
import { DICTIONARY } from "@/constants/dictionary";
import type { PestDoc, RegionDoc } from "@/types";
import { COMBINATION_ERRORS, type GeneratedContent } from "../types";
import { resolveAdminActionError } from "@/features/auth/adminActionError";
import type { CombinationSelection } from "./useCombinationSelection";
import type { CombinationContent } from "./useCombinationContent";

type Feedback = { type: "success" | "error"; message: string } | null;

type CombinationWorkflowOptions = {
  selection: CombinationSelection;
  content: CombinationContent;
  regions: RegionDoc[];
  pests: PestDoc[];
  onFeedback: (feedback: Feedback) => void;
};

/**
 * Manages the two primary async workflows:
 *  - AI content generation via Gemini
 *  - Saving combination content to Firestore
 *
 * Feedback is surfaced via the provided onFeedback callback.
 */
export const useCombinationWorkflow = ({
  selection,
  content,
  regions,
  pests,
  onFeedback,
}: CombinationWorkflowOptions) => {
  const d = DICTIONARY.admin.combinations;
  const router = useRouter();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /** Triggers Gemini AI to generate SEO content for the selected combination. */
  const handleGenerate = useCallback(async () => {
    const { selectedRegion, selectedPest } = selection;

    if (!selectedRegion || !selectedPest) {
      onFeedback({ type: "error", message: d.errorRequired });
      return;
    }

    if (content.isExistingCombination) {
      onFeedback({
        type: "error",
        message: content.isArchivedExistingCombination ? d.errorArchivedExists : d.errorAlreadyExists,
      });
      return;
    }

    setIsGenerating(true);
    onFeedback(null);

    try {
      const result = await generateCombinationContent(selectedRegion, selectedPest);

      if (result.success && result.data) {
        content.populateContent(result.data);
        onFeedback({ type: "success", message: d.successGen });
      } else if (!result.success && result.error === COMBINATION_ERRORS.AI_QUOTA_EXCEEDED) {
        onFeedback({ type: "error", message: d.regenerateQuotaError });
      } else if (!result.success && result.error === COMBINATION_ERRORS.AI_PROVIDER_UNAVAILABLE) {
        onFeedback({ type: "error", message: d.errorProviderUnavailable });
      } else if (!result.success) {
        onFeedback({
          type: "error",
          message: resolveAdminActionError(result, d.errorDefault),
        });
      } else {
        onFeedback({ type: "error", message: d.errorDefault });
      }
    } catch {
      onFeedback({ type: "error", message: d.errorDefault });
    } finally {
      setIsGenerating(false);
    }
  }, [selection, content, onFeedback, d.errorRequired, d.errorArchivedExists, d.errorAlreadyExists, d.successGen, d.regenerateQuotaError, d.errorProviderUnavailable, d.errorDefault]);

  /** Saves the current content to Firestore and resets the form on success. */
  const handleSave = useCallback(async () => {
    const { selectedRegion, selectedPest, clearSelection } = selection;
    if (!selectedRegion || !selectedPest) return;

    if (content.isExistingCombination) {
      onFeedback({
        type: "error",
        message: content.isArchivedExistingCombination ? d.errorArchivedExists : d.errorAlreadyExists,
      });
      return;
    }

    setIsSaving(true);
    onFeedback(null);

    const regionName = regions.find((r) => r.slug === selectedRegion)?.name || selectedRegion;
    const pestName = pests.find((p) => p.slug === selectedPest)?.name || selectedPest;
    const contentData: GeneratedContent = {
      title: content.title,
      h1: content.h1,
      metaDesc: content.metaDesc,
      content: content.content,
      faq: content.faq,
    };

    try {
      const result = await saveCombination(
        selectedRegion,
        selectedPest,
        regionName,
        pestName,
        contentData,
        content.isActive,
      );

      if (result.success) {
        onFeedback({ type: "success", message: d.successSave });
        localStorage.removeItem(`admin_combo_draft_${selectedRegion}_${selectedPest}`);

        content.clearContent();
        clearSelection();

        router.refresh();

        setTimeout(() => onFeedback(null), 3000);
      } else {
        if (result.error === "ARCHIVED_EXISTS") {
          onFeedback({ type: "error", message: d.errorArchivedExists });
        } else if (result.error === "ALREADY_EXISTS") {
          onFeedback({ type: "error", message: d.errorAlreadyExists });
        } else {
          onFeedback({
            type: "error",
            message: resolveAdminActionError(result, d.errorSave),
          });
        }
      }
    } catch {
      onFeedback({ type: "error", message: d.errorSave });
    } finally {
      setIsSaving(false);
    }
  }, [selection, content, regions, pests, onFeedback, d.errorArchivedExists, d.errorAlreadyExists, d.successSave, d.errorSave, router]);

  return {
    isGenerating,
    isSaving,
    handleGenerate,
    handleSave,
  };
};
