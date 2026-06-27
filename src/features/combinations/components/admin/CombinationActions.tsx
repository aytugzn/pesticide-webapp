"use client";

import { DICTIONARY } from "@/constants/dictionary";
import { RotateCcw, Eye, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const ICON_SIZE = 16;

type CombinationActionsProps = {
  isActive: boolean;
  setIsActive: (value: boolean) => void;
  isGenerating: boolean;
  isSaving: boolean;
  hasContent: boolean;
  canGenerate: boolean;
  onRegenerate: () => void;
  onPreview: () => void;
  onSave: () => void;
}

/**
 * Bottom action bar: active toggle, regenerate, preview, and save buttons.
 */
export const CombinationActions = ({
  isActive,
  setIsActive,
  isGenerating,
  isSaving,
  hasContent,
  canGenerate,
  onRegenerate,
  onPreview,
  onSave,
}: CombinationActionsProps) => {
  const d = DICTIONARY.admin.combinations;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t border-brand-border">
      <Input
        id="combo-active"
        type="checkbox"
        label={d.isActive}
        checked={isActive}
        onChange={(e) => setIsActive(e.target.checked)}
      />

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto sm:ml-auto mt-4 sm:mt-0">
        <div title={d.tooltipRegenerate} className="w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onRegenerate}
            disabled={isGenerating || !canGenerate}
            className="w-full sm:w-auto"
          >
            <RotateCcw size={ICON_SIZE} aria-hidden="true" />
            {d.generateBtn}
          </Button>
        </div>

        <div title={d.tooltipPreview} className="w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onPreview}
            disabled={!hasContent}
            className="w-full sm:w-auto bg-brand-surface border-brand-border text-text-primary"
          >
            <Eye size={ICON_SIZE} aria-hidden="true" />
            {d.previewBtn}
          </Button>
        </div>

        <div title={d.tooltipSave} className="w-full sm:w-auto">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onSave}
            disabled={isSaving || !hasContent}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 size={ICON_SIZE} className="animate-spin" aria-hidden="true" />
                {d.savingBtn}
              </>
            ) : (
              <>
                <Save size={ICON_SIZE} aria-hidden="true" />
                {d.saveBtn}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
