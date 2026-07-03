"use client";

import { DICTIONARY } from "@/constants/dictionary";
import { SeoEntityForm } from "@/features/seo-content/components/admin/SeoEntityForm";
import type { SeoEntityInitialData } from "@/features/seo-content/types";
import {
  checkRegionExists,
  generateRegionContent,
  saveRegion,
} from "../../actions";

export type RegionFormProps = {
  initialData?: SeoEntityInitialData;
};

export const RegionForm = ({ initialData }: RegionFormProps = {}) => {
  return (
    <SeoEntityForm
      entity="region"
      dictionary={DICTIONARY.admin.regions}
      initialData={initialData}
      checkExists={checkRegionExists}
      generateContent={generateRegionContent}
      save={saveRegion}
    />
  );
};
