"use client";

import { useState, useCallback, useEffect } from "react";
import type { PestDoc, RegionDoc } from "@/types";
import { Alert } from "@/components/ui/Alert";
import { CombinationGenerator } from "./CombinationGenerator";
import { CombinationEditor } from "./CombinationEditor";
import { CombinationFaqEditor } from "./CombinationFaqEditor";
import { CombinationActions } from "./CombinationActions";
import { CombinationPreviewModal } from "./CombinationPreviewModal";
import { useCombinationSelection } from "../../hooks/useCombinationSelection";
import { useCombinationContent } from "../../hooks/useCombinationContent";
import { useCombinationWorkflow } from "../../hooks/useCombinationWorkflow";

type CombinationFormProps = {
  regions: RegionDoc[];
  pests: PestDoc[];
};

type Feedback = { type: "success" | "error"; message: string } | null;

/**
 * Thin container for the combination content workflow.
 * All state and business logic is delegated to focused custom hooks.
 * This component is responsible only for orchestrating hooks and rendering.
 */
export const CombinationForm = ({ regions, pests }: CombinationFormProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const selection = useCombinationSelection();

  const content = useCombinationContent({
    onFeedback: setFeedback,
  });

  const workflow = useCombinationWorkflow({
    selection,
    content,
    regions,
    pests,
    onFeedback: setFeedback,
  });

  /** Handles combined selection change + content loading when a region is chosen. */
  const handleRegionChange = useCallback(
    async (value: string) => {
      selection.handleRegionChange(value);
      await content.loadContent(value, selection.selectedPest);
    },
    [selection, content],
  );

  /** Handles combined selection change + content loading when a pest is chosen. */
  const handlePestChange = useCallback(
    async (value: string) => {
      selection.handlePestChange(value);
      await content.loadContent(selection.selectedRegion, value);
    },
    [selection, content],
  );

  // Restore last selected combination from localStorage on mount
  useEffect(() => {
    const last = selection.getLastSelection();
    if (!last) return;
    selection.setSelectedRegion(last.lastRegion);
    selection.setSelectedPest(last.lastPest);
    content.loadContent(last.lastRegion, last.lastPest);
  // loadContent and selection setters are stable; intentionally run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const regionName = regions.find((r) => r.slug === selection.selectedRegion)?.name || selection.selectedRegion;
  const pestName = pests.find((p) => p.slug === selection.selectedPest)?.name || selection.selectedPest;

  return (
    <section className="space-y-8">
      <CombinationGenerator
        regions={regions}
        pests={pests}
        selectedRegion={selection.selectedRegion}
        selectedPest={selection.selectedPest}
        isGenerating={workflow.isGenerating}
        onRegionChange={handleRegionChange}
        onPestChange={handlePestChange}
        onGenerate={workflow.handleGenerate}
      />

      {feedback && <Alert variant={feedback.type} message={feedback.message} />}

      {content.hasContent && (
        <div className="bg-brand-surface border border-brand-border rounded-brand-lg p-6 space-y-5">
          <CombinationEditor
            title={content.title}
            setTitle={content.setTitle}
            h1={content.h1}
            setH1={content.setH1}
            metaDesc={content.metaDesc}
            setMetaDesc={content.setMetaDesc}
            content={content.content}
            setContent={content.setContent}
          />

          <CombinationFaqEditor faq={content.faq} onFaqChange={content.handleFaqChange} />

          <CombinationActions
            isActive={content.isActive}
            setIsActive={content.setIsActive}
            isGenerating={workflow.isGenerating}
            isSaving={workflow.isSaving}
            hasContent={content.hasContent}
            canGenerate={!!selection.selectedRegion && !!selection.selectedPest}
            onRegenerate={workflow.handleGenerate}
            onPreview={() => setIsPreviewOpen(true)}
            onSave={workflow.handleSave}
          />
        </div>
      )}

      <CombinationPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={{
          title: content.title,
          h1: content.h1,
          metaDesc: content.metaDesc,
          content: content.content,
          faq: content.faq,
          regionSlug: selection.selectedRegion,
          pestSlug: selection.selectedPest,
          regionName,
          pestName,
        }}
      />
    </section>
  );
};
