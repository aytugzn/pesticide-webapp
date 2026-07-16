"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import {
  AdminEntityTable,
  type AdminEntityColumn,
} from "@/components/ui/AdminEntityTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { DICTIONARY } from "@/constants/dictionary";
import { useCombinationAdminToast } from "@/features/combinations/components/admin/CombinationJobProvider";
import { saveReviewsDraft } from "@/features/reviews/actions";
import { REVIEW_LIMITS } from "@/features/reviews/constants";
import { reviewItemSchema } from "@/features/reviews/schemas";
import type {
  AdminReviewsData,
  ReviewItem,
} from "@/features/reviews/types";

type ReviewFormState = {
  id: string;
  authorName: string;
  rating: string;
  text: string;
  authorPhotoUrl: string;
  reviewUrl: string;
};

type ReviewFieldErrors = Partial<
  Record<keyof ReviewFormState, string>
>;

type ReviewFormPanelProps = {
  form: ReviewFormState;
  fieldErrors: ReviewFieldErrors;
  idPrefix: string;
  submitLabel: string;
  title?: string;
  titleId?: string;
  autoFocus?: boolean;
  onFieldChange: (field: keyof ReviewFormState, value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

const createFormState = (review?: ReviewItem): ReviewFormState => ({
  id: review?.id ?? crypto.randomUUID(),
  authorName: review?.authorName ?? "",
  rating: String(review?.rating ?? 5),
  text: review?.text ?? "",
  authorPhotoUrl: review?.authorPhotoUrl ?? "",
  reviewUrl: review?.reviewUrl ?? "",
});

/**
 * Maps shared Zod issue paths to stable, localized field-level messages.
 *
 * @param issues - Validation issues returned by the canonical review schema
 * @returns Errors addressable by controlled review form fields
 */
const createFieldErrors = (
  issues: { path: PropertyKey[] }[],
): ReviewFieldErrors => {
  const validation = DICTIONARY.admin.reviews.validation;
  const errors: ReviewFieldErrors = {};

  issues.forEach((issue) => {
    const field = issue.path[0];
    if (field === "authorName") errors.authorName = validation.customerName;
    if (field === "text") errors.text = validation.reviewText;
    if (field === "rating") errors.rating = validation.rating;
    if (field === "authorPhotoUrl") errors.authorPhotoUrl = validation.url;
    if (field === "reviewUrl") errors.reviewUrl = validation.url;
  });

  return errors;
};

/**
 * Renders the shared review create/edit fields without owning workflow state.
 *
 * @param props - Controlled values, validation messages, labels, and callbacks
 * @returns A consistent review form panel for page and table wrappers
 */
const ReviewFormPanel = ({
  form,
  fieldErrors,
  idPrefix,
  submitLabel,
  title,
  titleId,
  autoFocus = false,
  onFieldChange,
  onCancel,
  onSubmit,
}: ReviewFormPanelProps) => {
  const d = DICTIONARY.admin.reviews;

  return (
    <div className="rounded-brand-lg border border-brand-border bg-surface-neutral/40 px-4 py-5 shadow-sm sm:px-5 sm:py-6">
      {title && (
        <h2
          id={titleId}
          className="mb-5 border-b border-brand-border pb-4 font-heading text-lg font-bold text-text-primary"
        >
          {title}
        </h2>
      )}
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Input
              id={`${idPrefix}-author-name`}
              data-review-author-input={autoFocus ? "" : undefined}
              label={d.customerName}
              placeholder={d.customerNamePlaceholder}
              value={form.authorName}
              maxLength={REVIEW_LIMITS.AUTHOR_NAME}
              showCharacterCount
              error={fieldErrors.authorName}
              onChange={(event) => onFieldChange("authorName", event.target.value)}
            />
          </div>
          <Input
            id={`${idPrefix}-rating`}
            label={d.rating}
            type="number"
            min={1}
            max={5}
            step={1}
            value={form.rating}
            error={fieldErrors.rating}
            onChange={(event) => onFieldChange("rating", event.target.value)}
          />
        </div>
        <Textarea
          id={`${idPrefix}-text`}
          label={d.reviewText}
          placeholder={d.reviewTextPlaceholder}
          value={form.text}
          maxLength={REVIEW_LIMITS.TEXT}
          showCharacterCount
          error={fieldErrors.text}
          rows={3}
          onChange={(event) => onFieldChange("text", event.target.value)}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Input
            id={`${idPrefix}-avatar-url`}
            label={d.avatarUrl}
            optionalText={d.optional}
            type="url"
            placeholder={d.avatarUrlPlaceholder}
            value={form.authorPhotoUrl}
            maxLength={REVIEW_LIMITS.URL}
            error={fieldErrors.authorPhotoUrl}
            onChange={(event) => onFieldChange("authorPhotoUrl", event.target.value)}
          />
          <Input
            id={`${idPrefix}-source-url`}
            label={d.sourceUrl}
            optionalText={d.optional}
            type="url"
            placeholder={d.sourceUrlPlaceholder}
            value={form.reviewUrl}
            maxLength={REVIEW_LIMITS.URL}
            error={fieldErrors.reviewUrl}
            onChange={(event) => onFieldChange("reviewUrl", event.target.value)}
          />
        </div>
        <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            {d.cancel}
          </Button>
          <Button type="button" variant="primary" onClick={onSubmit}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Provides local CRUD and ordering over the review draft, with one explicit
 * server save boundary. Published reviews remain untouched until global publish.
 */
export const ReviewsManager = ({
  initialData,
}: {
  initialData: AdminReviewsData;
}) => {
  const d = DICTIONARY.admin.reviews;
  const { showToast } = useCombinationAdminToast();
  const [items, setItems] = useState(initialData.items);
  const [savedItemsJson, setSavedItemsJson] = useState(() =>
    JSON.stringify(initialData.items),
  );
  const [form, setForm] = useState<ReviewFormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ReviewFieldErrors>({});
  const [reviewToDelete, setReviewToDelete] = useState<ReviewItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasChanges = JSON.stringify(items) !== savedItemsJson;
  const editingReviewId = form && items.some((item) => item.id === form.id)
    ? form.id
    : null;
  const isCreatingReview = Boolean(form && !editingReviewId);
  const activeFormId = form?.id;

  useEffect(() => {
    if (!activeFormId) return;

    const visibleAuthorInput = Array.from(
      document.querySelectorAll<HTMLInputElement>("[data-review-author-input]"),
    ).find((input) => input.getClientRects().length > 0);
    visibleAuthorInput?.focus();
  }, [activeFormId]);

  const updateForm = (field: keyof ReviewFormState, value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleApplyReview = () => {
    if (!form) return;
    const parsed = reviewItemSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(createFieldErrors(parsed.error.issues));
      return;
    }

    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.id === parsed.data.id);
      if (existingIndex < 0) return [...current, parsed.data];

      return current.map((item, index) =>
        index === existingIndex ? parsed.data : item,
      );
    });
    setForm(null);
    setFieldErrors({});
  };

  const handleCloseForm = () => {
    setForm(null);
    setFieldErrors({});
  };

  const moveReview = (index: number, offset: -1 | 1) => {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((current) => {
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const result = await saveReviewsDraft({
        items,
        viewAllUrl: initialData.viewAllUrl ?? "",
      });
      if (!result.success) {
        showToast({ variant: "error", message: d.saveError });
        return;
      }

      setSavedItemsJson(JSON.stringify(items));
      showToast({ variant: "success", message: d.saveSuccess });
    } catch {
      showToast({ variant: "error", message: d.saveError });
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditPanel = (
    row: ReviewItem,
    presentation: "mobile" | "desktop",
  ) => {
    if (editingReviewId !== row.id || !form) return null;

    return (
      <section
        aria-label={d.editReview}
        className="mx-auto my-2 max-w-5xl"
      >
        <ReviewFormPanel
          form={form}
          fieldErrors={fieldErrors}
          idPrefix={`review-edit-${row.id}-${presentation}`}
          submitLabel={d.apply}
          autoFocus
          onFieldChange={updateForm}
          onCancel={handleCloseForm}
          onSubmit={handleApplyReview}
        />
      </section>
    );
  };

  const columns: AdminEntityColumn<ReviewItem>[] = [
      {
        key: "order",
        header: d.table.order,
        className: "w-20",
        render: (row) => items.findIndex((item) => item.id === row.id) + 1,
      },
      {
        key: "customer",
        header: d.table.customer,
        render: (row) => <span className="font-medium">{row.authorName}</span>,
      },
      {
        key: "rating",
        header: d.table.rating,
        className: "w-20",
        render: (row) => row.rating,
      },
      {
        key: "comment",
        header: d.table.comment,
        render: (row) => <p className="line-clamp-3 max-w-xl">{row.text}</p>,
      },
      {
        key: "actions",
        header: d.table.actions,
        className: "min-w-72",
        render: (row) => {
          const index = items.findIndex((item) => item.id === row.id);
          const isEditingThisRow = editingReviewId === row.id;

          if (isEditingThisRow) return null;

          return (
            <div className="flex flex-wrap justify-end gap-2 md:flex-nowrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => moveReview(index, -1)}
                disabled={index === 0 || Boolean(form)}
                aria-label={d.moveUp}
                title={d.moveUp}
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => moveReview(index, 1)}
                disabled={index === items.length - 1 || Boolean(form)}
                aria-label={d.moveDown}
                title={d.moveDown}
              >
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForm(createFormState(row))}
                disabled={Boolean(form)}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                {d.edit}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setReviewToDelete(row)}
                disabled={Boolean(form)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {d.delete}
              </Button>
            </div>
          );
        },
      },
    ];

  return (
    <div className="space-y-5">
      <Alert variant="info" message={d.draftNotice} />
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isCreatingReview) {
              handleCloseForm();
              return;
            }
            setForm(createFormState());
          }}
          disabled={Boolean(editingReviewId)}
          aria-expanded={isCreatingReview}
          aria-controls="new-review-panel"
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {items.length === 0 ? d.addFirst : d.addReview}
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSaveDraft}
          disabled={!hasChanges || isSaving}
          className="w-full sm:w-auto"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {isSaving ? d.saving : d.save}
        </Button>
      </div>

      {isCreatingReview && form && (
        <section
          id="new-review-panel"
          aria-labelledby="new-review-panel-title"
          className="w-full"
        >
          <ReviewFormPanel
            form={form}
            fieldErrors={fieldErrors}
            idPrefix="review-create"
            title={d.addReview}
            titleId="new-review-panel-title"
            submitLabel={d.apply}
            autoFocus
            onFieldChange={updateForm}
            onCancel={handleCloseForm}
            onSubmit={handleApplyReview}
          />
        </section>
      )}

      <AdminEntityTable
        rows={items}
        columns={columns}
        getRowKey={(row) => row.id}
        emptyMessage={d.empty}
        desktopBreakpoint="xl"
        renderExpandedContent={renderEditPanel}
      />

      <Modal
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        title={d.deleteTitle}
      >
        <p className="text-text-secondary">{d.deleteConfirm}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setReviewToDelete(null)}>
            {d.cancel}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              setItems((current) =>
                current.filter((item) => item.id !== reviewToDelete?.id),
              );
              setReviewToDelete(null);
            }}
          >
            {d.delete}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
