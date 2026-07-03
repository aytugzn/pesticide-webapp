"use client";

import { DICTIONARY } from "@/constants/dictionary";
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
      onSuccess={onSuccess}
    />
  );
};
