"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DICTIONARY } from "@/constants/dictionary";
import { useCombinationAdminToast } from "@/features/combinations/components/admin/CombinationJobProvider";
import { SeoEntityForm } from "@/features/seo-content/components/admin/SeoEntityForm";
import type { SeoEntityInitialData } from "@/features/seo-content/types";
import { checkPestExists, generatePestContent, savePest, updatePest } from "../../actions";

export type PestFormProps = {
  mode?: "create" | "edit";
  initialData?: SeoEntityInitialData;
  onSuccess?: () => void;
};

export const PestForm = ({ mode = "create", initialData, onSuccess }: PestFormProps = {}) => {
  const { showToast } = useCombinationAdminToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const isCreateMode = mode === "create";
  const panelId = "new-pest-panel";

  const handleSuccess = () => {
    if (isCreateMode) {
      setIsCreateOpen(false);
      showToast({ variant: "success", message: DICTIONARY.admin.pests.successSave });
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
          {DICTIONARY.admin.pests.addPest}
        </Button>
        {isCreateOpen && (
          <section id={panelId} className="max-w-5xl">
            <SeoEntityForm
              entity="pest"
              mode="create"
              dictionary={DICTIONARY.admin.pests}
              initialData={initialData}
              checkExists={checkPestExists}
              generateContent={generatePestContent}
              save={savePest}
              update={(slug, payload) => updatePest(slug, payload as unknown as import("../../types").UpdatePestInput)}
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
      entity="pest"
      mode={mode}
      dictionary={DICTIONARY.admin.pests}
      initialData={initialData}
      checkExists={checkPestExists}
      generateContent={generatePestContent}
      save={savePest}
      update={(slug, payload) => updatePest(slug, payload as unknown as import("../../types").UpdatePestInput)}
      onSuccess={handleSuccess}
    />
  );
};
