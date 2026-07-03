"use client";

import { DICTIONARY } from "@/constants/dictionary";
import { SeoEntityForm } from "@/features/seo-content/components/admin/SeoEntityForm";
import type { SeoEntityInitialData } from "@/features/seo-content/types";
import { checkPestExists, generatePestContent, savePest, updatePest } from "../../actions";

export type PestFormProps = {
  mode?: "create" | "edit";
  initialData?: SeoEntityInitialData;
  onSuccess?: () => void;
};

export const PestForm = ({ mode = "create", initialData, onSuccess }: PestFormProps = {}) => {
  return (
    <SeoEntityForm
      entity="pest"
      mode={mode}
      dictionary={DICTIONARY.admin.pests}
      initialData={initialData}
      checkExists={checkPestExists}
      generateContent={generatePestContent}
      save={(slug, name, description, content, isActive) =>
        savePest(slug, name, description, undefined, content, isActive)
      }
      update={(slug, payload) => updatePest(slug, payload as unknown as import("../../types").UpdatePestInput)}
      onSuccess={onSuccess}
    />
  );
};
