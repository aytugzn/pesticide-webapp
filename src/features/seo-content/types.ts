import type { ActionResponse } from "@/types";

export type SeoGeneratedContent = {
  title: string;
  description: string;
  cardDescription?: string;
  h1: string;
  metaDesc: string;
  content: string;
  faq: { question: string; answer: string }[];
};

export type SeoEntityInitialData = {
  name: string;
  slug: string;
  description: string;
  cardDescription: string;
  title: string;
  h1: string;
  metaDesc: string;
  content: string;
  faq: { question: string; answer: string }[];
  isActive: boolean;
};

export type SeoEntityDictionary = {
  generatorTitle: string;
  formName: string;
  formNamePlaceholder: string;
  formSlug: string;
  formSlugPlaceholder: string;
  formDesc: string;
  isActive: string;
  errorRequired: string;
  errorDuplicate: string;
  errorAiBusy: string;
  errorAiGen: string;
  errorAiVal: string;
  errorQuotaExceeded: string;
  errorDefault: string;
  successGen: string;
  successSave: string;
  errorSave: string;
  updateSuccess: string;
  updateError: string;
  saving: string;
  save: string;
  generateBtn: string;
  generatingBtn: string;
  regenerateBtn: string;
  regeneratingBtn: string;
  regenerateSuccess: string;
  titleLabel: string;
  h1Label: string;
  metaLabel: string;
  contentLabel: string;
};

export type SeoEntityFormConfig<TError extends string> = {
  entity: "pest" | "region";
  mode?: "create" | "edit";
  dictionary: SeoEntityDictionary;
  initialData?: SeoEntityInitialData;
  checkExists: (slug: string) => Promise<ActionResponse<boolean, TError>>;
  generateContent: (
    name: string,
    description: string,
  ) => Promise<ActionResponse<SeoGeneratedContent, TError>>;
  save: (
    slug: string,
    name: string,
    description: string | undefined,
    content: SeoGeneratedContent,
    isActive: boolean,
  ) => Promise<ActionResponse<void, TError>>;
  update?: (
    slug: string,
    payload: Record<string, unknown>,
  ) => Promise<ActionResponse<void, TError>>;
  onSuccess?: () => void;
};
