"use client";

import { DICTIONARY } from "@/constants/dictionary";
import type { PestDoc, RegionDoc } from "@/types";
import { Sparkles, Loader2 } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const ICON_SIZE = 16;

type CombinationGeneratorProps = {
  regions: RegionDoc[];
  pests: PestDoc[];
  selectedRegion: string;
  selectedPest: string;
  isGenerating: boolean;
  onRegionChange: (value: string) => void;
  onPestChange: (value: string) => void;
  onGenerate: () => void;
}

/**
 * Region/pest selection and AI content generation trigger.
 * Renders the two dropdowns and the "Generate" button.
 */
export const CombinationGenerator = ({
  regions,
  pests,
  selectedRegion,
  selectedPest,
  isGenerating,
  onRegionChange,
  onPestChange,
  onGenerate,
}: CombinationGeneratorProps) => {
  const d = DICTIONARY.admin.combinations;

  return (
    <div className="bg-brand-surface border border-brand-border rounded-brand-lg p-6">
      <h2 className="font-heading font-bold text-text-primary text-lg mb-4">
        {d.generatorTitle}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Select
          id="combo-region"
          name="region"
          label={d.selectRegion}
          placeholder={d.selectRegionEmpty}
          value={selectedRegion}
          options={regions.map((r) => ({ value: r.slug, label: r.name }))}
          onChange={onRegionChange}
        />

        <Select
          id="combo-pest"
          name="pest"
          label={d.selectPest}
          placeholder={d.selectPestEmpty}
          value={selectedPest}
          options={pests.map((p) => ({ value: p.slug, label: p.name }))}
          onChange={onPestChange}
        />
      </div>

      <div className="w-full sm:w-auto flex">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="w-full sm:w-auto"
          onClick={onGenerate}
          disabled={isGenerating || !selectedRegion || !selectedPest}
        >
          {isGenerating ? (
            <>
              <Loader2 size={ICON_SIZE} className="animate-spin" aria-hidden="true" />
              {d.generatingBtn}
            </>
          ) : (
            <>
              <Sparkles size={ICON_SIZE} aria-hidden="true" />
              {d.generateBtn}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
