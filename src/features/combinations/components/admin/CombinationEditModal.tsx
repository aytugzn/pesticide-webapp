"use client";

import { useState } from "react";
import { X, Loader2, Save, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { SeoFaqEditor } from "@/features/seo-content/components/admin/SeoFaqEditor";
import { updateCombination } from "../../actions";
import { generateCombinationContent } from "../../actions/ai";
import { DICTIONARY } from "@/constants/dictionary";
import { COMBINATION_ERRORS } from "../../types";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useCombinationAdminToast } from "./CombinationJobProvider";
import type { CombinationRow, GeneratedContent } from "../../types";

type CombinationEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  row: CombinationRow | null;
  onSuccess: (updatedRow: CombinationRow) => void;
};

type CombinationEditFormProps = {
  row: CombinationRow;
  onClose: () => void;
  onSuccess: (updatedRow: CombinationRow) => void;
};

const CombinationEditForm = ({ row, onClose, onSuccess }: CombinationEditFormProps) => {
  const d = DICTIONARY.admin.combinations;
  const { showToast } = useCombinationAdminToast();

  const initialFormData: GeneratedContent = {
    title: row.title || "",
    h1: row.h1 || "",
    metaDesc: row.metaDesc || "",
    content: row.content || "",
    faq: row.faq || [],
  };
  const [formData, setFormData] = useState<GeneratedContent>(initialFormData);

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const publishFeedback = (feedback: {
    type: "success" | "error";
    message: string;
  }) => {
    showToast({
      variant: feedback.type,
      message: feedback.message,
    });
  };

  const updateField = <TKey extends keyof GeneratedContent>(
    key: TKey,
    value: GeneratedContent[TKey],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFaqChange = (
    index: number,
    field: "question" | "answer",
    value: string,
  ) => {
    setFormData((prev) => {
      const nextFaq = [...prev.faq];
      nextFaq[index] = { ...nextFaq[index], [field]: value };
      return { ...prev, faq: nextFaq };
    });
  };

  const isFormValid =
    formData.title.trim() !== "" &&
    formData.h1.trim() !== "" &&
    formData.metaDesc.trim() !== "" &&
    formData.content.replace(/<[^>]*>?/gm, "").trim() !== "";
  const isDirty =
    formData.title !== initialFormData.title ||
    formData.h1 !== initialFormData.h1 ||
    formData.metaDesc !== initialFormData.metaDesc ||
    formData.content !== initialFormData.content ||
    JSON.stringify(formData.faq) !== JSON.stringify(initialFormData.faq);

  const handleSave = async () => {
    if (!isDirty || !isFormValid) return;

    setIsSaving(true);

    try {
      const res = await updateCombination(row.region, row.pest, formData);
      if (res.success) {
        showToast({ variant: "success", message: d.updateSuccess });
        onSuccess({ ...row, ...formData });
        onClose();
      } else {
        publishFeedback({ type: "error", message: d.updateError });
      }
    } catch {
      publishFeedback({ type: "error", message: d.errorDefault });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);

    try {
      const res = await generateCombinationContent(row.region, row.pest);
      if (res.success) {
        if (res.data) {
          setFormData(res.data);
          publishFeedback({ type: "success", message: d.regenerateSuccess });
        }
      } else {
        if (res.error === COMBINATION_ERRORS.AI_QUOTA_EXCEEDED) {
          publishFeedback({ type: "error", message: d.regenerateQuotaError });
        } else if (res.error === COMBINATION_ERRORS.AI_PROVIDER_UNAVAILABLE) {
          publishFeedback({ type: "error", message: d.errorProviderUnavailable });
        } else {
          publishFeedback({ type: "error", message: d.regenerateError });
        }
      }
    } catch {
      publishFeedback({ type: "error", message: d.regenerateError });
    } finally {
      setIsGenerating(false);
    }
  };

  const isPending = isSaving || isGenerating;

  return (
    <section
      className="max-h-full w-full max-w-5xl min-w-0 bg-brand-surface rounded-xl shadow-2xl flex flex-col overflow-hidden overflow-x-hidden pointer-events-auto transform transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <header className="flex items-center justify-between gap-3 p-4 border-b border-brand-border/50 shrink-0 bg-brand-surface sm:p-5">
        <h2
          id="modal-title"
          className="min-w-0 break-words font-heading font-bold text-lg text-text-primary"
        >
          {d.editTitle}
        </h2>
        <Button
          variant="unstyled"
          size="none"
          onClick={onClose}
          disabled={isPending}
          className="min-h-10 min-w-10 shrink-0 p-2 -mr-2 text-text-muted hover:text-text-primary rounded-md transition-colors"
          aria-label={DICTIONARY.global.ui.closeAria}
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </Button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 bg-brand-surface sm:p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="edit-region"
              label={d.table.region}
              value={row.regionName || row.region}
              disabled
            />
            <Input
              id="edit-pest"
              label={d.table.pest}
              value={row.pestName || row.pest}
              disabled
            />
          </div>

          <div className="space-y-4">
            <Input
              id="edit-title"
              label={d.formTitle}
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
            />

            <Textarea
              id="edit-meta"
              label={d.formMeta}
              value={formData.metaDesc}
              onChange={(e) => updateField("metaDesc", e.target.value)}
              rows={2}
            />

            <Input
              id="edit-h1"
              label={d.formH1}
              value={formData.h1}
              onChange={(e) => updateField("h1", e.target.value)}
            />

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">
                {d.formContent}
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(val) => updateField("content", val)}
              />
            </div>

            <SeoFaqEditor
              faq={formData.faq}
              onFaqChange={handleFaqChange}
            />
          </div>
        </div>
      </div>

      <footer className="shrink-0 border-t border-brand-border/50 p-4 flex flex-col gap-3 bg-brand-surface sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {d.regeneratingWithAi}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {d.regenerateWithAi}
              </>
            )}
          </Button>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {DICTIONARY.global.ui.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isPending || !isFormValid || !isDirty}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {d.savingBtn}
              </>
            ) : (
              <>
                <Save size={16} />
                {d.update}
              </>
            )}
          </Button>
        </div>
      </footer>
    </section>
  );
};

export const CombinationEditModal = ({
  isOpen,
  onClose,
  row,
  onSuccess,
}: CombinationEditModalProps) => {
  useScrollLock(isOpen);

  if (!isOpen || !row) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-overlay-strong p-3 backdrop-blur-sm transition-opacity duration-300 sm:p-6">
      <CombinationEditForm
        key={`${row.region}_${row.pest}`}
        row={row}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </div>
  );
};
