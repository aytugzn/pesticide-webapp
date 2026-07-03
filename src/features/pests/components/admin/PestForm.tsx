"use client";

import { DICTIONARY } from "@/constants/dictionary";
import { SeoEntityForm } from "@/features/seo-content/components/admin/SeoEntityForm";
import type { SeoEntityInitialData } from "@/features/seo-content/types";
import { checkPestExists, generatePestContent, savePest } from "../../actions";

export type PestFormProps = {
  initialData?: SeoEntityInitialData;
};

export const PestForm = ({ initialData }: PestFormProps = {}) => {
  return (
    <SeoEntityForm
      entity="pest"
      dictionary={DICTIONARY.admin.pests}
      initialData={initialData}
      checkExists={checkPestExists}
      generateContent={generatePestContent}
      save={(slug, name, description, content, isActive) =>
        savePest(slug, name, description, undefined, content, isActive)
      }
    />
  );
};
