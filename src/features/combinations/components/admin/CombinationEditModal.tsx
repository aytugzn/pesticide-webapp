"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { X, Loader2, Save, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Alert } from "@/components/ui/Alert";
import { CombinationFaqEditor } from "./CombinationFaqEditor";
import { updateCombination, generateCombinationContent } from "../../actions";
import { DICTIONARY } from "@/constants/dictionary";
import { COMBINATION_ERRORS } from "../../types";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { CombinationRow, GeneratedContent } from "../../types";

const MODAL_STYLE: CSSProperties = { maxHeight: "90vh" };

type Feedback = { type: "success" | "error"; message: string } | null;

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

  const [formData, setFormData] = useState<GeneratedContent>({
    title: row.title || "",
    h1: row.h1 || "",
    metaDesc: row.metaDesc || "",
    content: row.content || "",
    faq: row.faq || [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

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

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await updateCombination(row.region, row.pest, formData);
      if (res.success) {
        onSuccess({ ...row, ...formData });
        onClose();
      } else {
        setFeedback({ type: "error", message: d.updateError });
      }
    } catch {
      setFeedback({ type: "error", message: d.errorDefault });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    setFeedback(null);

    try {
      const res = await generateCombinationContent(row.region, row.pest);
      if (res.success) {
        if (res.data) {
          setFormData(res.data);
          setFeedback({ type: "success", message: d.regenerateSuccess });
        }
      } else {
        if (res.error === COMBINATION_ERRORS.AI_QUOTA_EXCEEDED) {
          setFeedback({ type: "error", message: d.regenerateQuotaError });
        } else {
          setFeedback({ type: "error", message: d.regenerateError });
        }
      }
    } catch {
      setFeedback({ type: "error", message: d.regenerateError });
    } finally {
      setIsGenerating(false);
    }
  };

  const isPending = isSaving || isGenerating;

  return (
    <section
      className="w-full max-w-5xl bg-brand-surface rounded-xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto transform transition-all duration-300"
      style={MODAL_STYLE}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <header className="flex items-center justify-between p-5 border-b border-brand-border/50 shrink-0 bg-brand-surface">
        <h2
          id="modal-title"
          className="font-heading font-bold text-lg text-text-primary"
        >
          {d.editTitle}
        </h2>
        <Button
          variant="unstyled"
          size="none"
          onClick={onClose}
          disabled={isPending}
          className="p-1.5 -mr-1.5 text-text-muted hover:text-text-primary rounded-md transition-colors"
          aria-label={DICTIONARY.global.ui.closeAria}
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </Button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-brand-surface">
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

          {feedback && (
            <Alert variant={feedback.type} message={feedback.message} />
          )}

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

            <CombinationFaqEditor
              faq={formData.faq}
              onFaqChange={handleFaqChange}
            />
          </div>
        </div>
      </div>

      <footer className="shrink-0 border-t border-brand-border/50 p-5 flex items-center justify-between gap-3 bg-brand-surface flex-wrap">
        <div>
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={isPending}
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

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {DICTIONARY.global.ui.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isPending || !isFormValid}
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-overlay-strong backdrop-blur-sm p-4 transition-opacity duration-300">
      <div className="min-h-full flex items-start justify-center py-6 pointer-events-none">
        <CombinationEditForm
          key={`${row.region}_${row.pest}`}
          row={row}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  );
};
