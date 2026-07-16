"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DICTIONARY } from "@/constants/dictionary";
import { useCombinationAdminToast } from "@/features/combinations/components/admin/CombinationJobProvider";
import { SeoEntityForm } from "@/features/seo-content/components/admin/SeoEntityForm";
import type { SeoEntityInitialData } from "@/features/seo-content/types";
import {
  checkRegionExists,
  generateRegionContent,
  saveRegion,
  updateRegion,
} from "../../actions";

export type RegionFormProps = {
  mode?: "create" | "edit";
  initialData?: SeoEntityInitialData;
  onSuccess?: () => void;
};

export const RegionForm = ({ mode = "create", initialData, onSuccess }: RegionFormProps = {}) => {
  const { showToast } = useCombinationAdminToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const isCreateMode = mode === "create";
  const panelId = "new-region-panel";

  const handleSuccess = () => {
    if (isCreateMode) {
      setIsCreateOpen(false);
      showToast({ variant: "success", message: DICTIONARY.admin.regions.successSave });
    }
    onSuccess?.();
  };

  if (isCreateMode) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsCreateOpen((current) => !current)}
          aria-expanded={isCreateOpen}
          aria-controls={panelId}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {DICTIONARY.admin.regions.addRegion}
        </Button>
        {isCreateOpen && (
          <section id={panelId} className="max-w-5xl">
            <SeoEntityForm
              entity="region"
              mode="create"
              dictionary={DICTIONARY.admin.regions}
              initialData={initialData}
              checkExists={checkRegionExists}
              generateContent={generateRegionContent}
              save={saveRegion}
              update={(slug, payload) => updateRegion(slug, payload as unknown as import("../../types").UpdateRegionInput)}
              onSuccess={handleSuccess}
              onCancel={() => setIsCreateOpen(false)}
              autoFocusName
            />
          </section>
        )}
      </div>
    );
  }

  return (
    <SeoEntityForm
      entity="region"
      mode={mode}
      dictionary={DICTIONARY.admin.regions}
      initialData={initialData}
      checkExists={checkRegionExists}
      generateContent={generateRegionContent}
      save={saveRegion}
      update={(slug, payload) => updateRegion(slug, payload as unknown as import("../../types").UpdateRegionInput)}
      onSuccess={handleSuccess}
    />
  );
};
