"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Alert } from "@/components/ui/Alert";
import { Sparkles, Loader2, Save } from "lucide-react";
import { SeoFaqEditor } from "./SeoFaqEditor";
import { slugify } from "@/utils/slugify";
import { Switch } from "@/components/ui/Switch";
import { DICTIONARY } from "@/constants/dictionary";
import { SeoEntityPreviewModal } from "./SeoEntityPreviewModal";
import { uploadAdminImage } from "@/features/image-upload/actions";
import type { ImageUploadErrorCode } from "@/features/image-upload/types";
import type { AppImage } from "@/types";
import type {
  SeoEntityFormConfig,
  SeoEntityInitialData,
  SeoGeneratedContent,
} from "@/features/seo-content/types";

type Feedback = { type: "success" | "error"; message: string } | null;

const PEST_SLUG_SUFFIX = "-ilaclama";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Converts optional entity data into the complete controlled form shape.
 */
const normalizeInitialData = (
  initialData?: SeoEntityInitialData,
): SeoEntityInitialData => ({
  name: initialData?.name ?? "",
  slug: initialData?.slug ?? "",
  description: initialData?.description ?? "",
  cardDescription: initialData?.cardDescription ?? "",
  image: initialData?.image,
  imageUrl: initialData?.imageUrl,
  isActive: initialData?.isActive ?? true,
  title: initialData?.title ?? "",
  h1: initialData?.h1 ?? "",
  metaDesc: initialData?.metaDesc ?? "",
  content: initialData?.content ?? "",
  faq: initialData?.faq ?? [],
});

/**
 * Creates the default slug for new SEO entities.
 */
const createEntitySlug = (
  entity: SeoEntityFormConfig<string>["entity"],
  name: string,
) => {
  const baseSlug = slugify(name);

  if (entity !== "pest" || !baseSlug) return baseSlug;
  if (baseSlug.endsWith(PEST_SLUG_SUFFIX)) return baseSlug;

  return `${baseSlug}${PEST_SLUG_SUFFIX}`;
};

export const SeoEntityForm = <TError extends string>({
  entity,
  mode = "create",
  dictionary: d,
  initialData,
  checkExists,
  generateContent,
  save,
  update,
  onSuccess,
}: SeoEntityFormConfig<TError>) => {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const normalizedInitialData = normalizeInitialData(initialData);
  const [formData, setFormData] = useState(() => normalizedInitialData);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState(normalizedInitialData.image?.alt ?? "");
  const [isImageRemoved, setIsImageRemoved] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const updateField = <TKey extends keyof SeoEntityInitialData>(
    key: TKey,
    value: SeoEntityInitialData[TKey],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const getErrorMessage = (error: TError) => {
    if (error === "AI_SERVER_BUSY") return d.errorAiBusy;
    if (error === "AI_GENERATION_FAILED") return d.errorAiGen;
    if (error === "VALIDATION_FAILED") return d.errorAiVal;
    if (error === "AI_QUOTA_EXCEEDED" as TError) return d.errorQuotaExceeded;

    return d.errorDefault;
  };

  const getUploadErrorMessage = (error: ImageUploadErrorCode) => {
    if (error === "INVALID_FILE_TYPE") return d.imageInvalidType;
    if (error === "FILE_TOO_LARGE") return d.imageTooLarge;
    if (error === "CONFIGURATION_FAILED") return d.imageConfigError;

    return d.imageUploadError;
  };

  const getDefaultImageAlt = () =>
    d.imageDefaultAltTemplate.replace("{name}", formData.name.trim());

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      event.target.value = "";
      setFeedback({ type: "error", message: d.imageInvalidType });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      event.target.value = "";
      setFeedback({ type: "error", message: d.imageTooLarge });
      return;
    }

    setSelectedImageFile(file);
    setIsImageRemoved(false);
    setFeedback(null);
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setImageAlt("");
    setIsImageRemoved(
      Boolean(normalizedInitialData.image || normalizedInitialData.imageUrl),
    );

    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!formData.name || !formData.slug) {
      setFeedback({ type: "error", message: d.errorRequired });
      return;
    }

    setIsGenerating(true);
    setFeedback(null);

    try {
      const existsRes = await checkExists(formData.slug);

      if (!existsRes.success) {
        setFeedback({
          type: "error",
          message: getErrorMessage(existsRes.error),
        });
        return;
      }

      if (existsRes.data) {
        setFeedback({ type: "error", message: d.errorDuplicate });
        return;
      }

      const res = await generateContent(formData.name, formData.description);

      if (res.success && res.data) {
        const generated = res.data;

        setFormData((prev) => ({
          ...prev,
          description: generated.description,
          cardDescription: generated.cardDescription ?? "",
          title: generated.title,
          h1: generated.h1,
          metaDesc: generated.metaDesc,
          content: generated.content,
          faq: generated.faq,
        }));
        setFeedback({ type: "success", message: d.successGen });
        return;
      }

      if (!res.success) {
        setFeedback({
          type: "error",
          message: getErrorMessage(res.error),
        });
      }
    } catch {
      setFeedback({ type: "error", message: d.errorDefault });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!formData.name) {
      setFeedback({ type: "error", message: d.errorRequired });
      return;
    }

    setIsGenerating(true);
    setFeedback(null);

    try {
      const res = await generateContent(formData.name, formData.description);

      if (res.success && res.data) {
        const generated = res.data;

        setFormData((prev) => ({
          ...prev,
          description: generated.description,
          cardDescription: generated.cardDescription ?? "",
          title: generated.title,
          h1: generated.h1,
          metaDesc: generated.metaDesc,
          content: generated.content,
          faq: generated.faq,
        }));
        setFeedback({ type: "success", message: d.regenerateSuccess });
        return;
      }

      if (!res.success) {
        setFeedback({
          type: "error",
          message: getErrorMessage(res.error),
        });
      }
    } catch {
      setFeedback({ type: "error", message: d.errorDefault });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      setFeedback({ type: "error", message: d.errorRequired });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      if (mode === "create") {
        const existsRes = await checkExists(formData.slug);

        if (!existsRes.success) {
          setFeedback({
            type: "error",
            message: getErrorMessage(existsRes.error),
          });
          return;
        }

        if (existsRes.data) {
          setFeedback({ type: "error", message: d.errorDuplicate });
          return;
        }
      }

      const generatedContent: SeoGeneratedContent = {
        title: formData.title,
        description: formData.description,
        cardDescription: formData.cardDescription || undefined,
        h1: formData.h1,
        metaDesc: formData.metaDesc,
        content: formData.content,
        faq: formData.faq,
      };

      const finalImageAlt = imageAlt.trim() || getDefaultImageAlt();
      let imageToSave: AppImage | undefined;

      if (selectedImageFile) {
        const uploadData = new FormData();
        uploadData.set("file", selectedImageFile);
        uploadData.set("entity", entity);
        uploadData.set("slug", formData.slug);
        uploadData.set("alt", finalImageAlt);

        const uploadResult = await uploadAdminImage(uploadData);
        if (!uploadResult.success || !uploadResult.data) {
          setFeedback({
            type: "error",
            message: getUploadErrorMessage(
              uploadResult.success ? "UPLOAD_FAILED" : uploadResult.error,
            ),
          });
          return;
        }

        imageToSave = uploadResult.data;
      } else if (
        !isImageRemoved &&
        formData.image &&
        finalImageAlt !== formData.image.alt
      ) {
        imageToSave = { ...formData.image, alt: finalImageAlt };
      }

      if (mode === "edit" && update) {
        const res = await update(formData.slug, {
          name: formData.name,
          description: formData.description,
          cardDescription: formData.cardDescription || undefined,
          title: formData.title,
          h1: formData.h1,
          metaDesc: formData.metaDesc,
          content: formData.content,
          faq: formData.faq,
          ...(isImageRemoved ? { image: null, imageUrl: null } : {}),
          ...(imageToSave ? { image: imageToSave } : {}),
        });

        if (res.success) {
          setFeedback({ type: "success", message: d.updateSuccess });
          router.refresh();
          onSuccess?.();
          return;
        }

        setFeedback({
          type: "error",
          message: getErrorMessage(res.error),
        });
        return;
      }

      const res = await save(
        formData.slug,
        formData.name,
        formData.description,
        imageToSave,
        generatedContent,
        formData.isActive,
      );

      if (res.success) {
        setFeedback({ type: "success", message: d.successSave });

        if (!initialData) {
          setFormData(normalizeInitialData());
          setSelectedImageFile(null);
          setImageAlt("");
          setIsImageRemoved(false);
          if (imageInputRef.current) imageInputRef.current.value = "";
        }

        router.refresh();
        onSuccess?.();
        return;
      }

      if (!res.success) {
        setFeedback({
          type: "error",
          message: getErrorMessage(res.error),
        });
      }
    } catch {
      setFeedback({ type: "error", message: d.errorDefault });
    } finally {
      setIsSaving(false);
    }
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

  const isDirty =
    formData.name !== normalizedInitialData.name ||
    formData.slug !== normalizedInitialData.slug ||
    formData.description !== normalizedInitialData.description ||
    formData.cardDescription !== normalizedInitialData.cardDescription ||
    selectedImageFile !== null ||
    isImageRemoved ||
    (Boolean(formData.image) &&
      imageAlt.trim() !== (formData.image?.alt ?? "")) ||
    formData.isActive !== normalizedInitialData.isActive ||
    formData.title !== normalizedInitialData.title ||
    formData.h1 !== normalizedInitialData.h1 ||
    formData.metaDesc !== normalizedInitialData.metaDesc ||
    formData.content !== normalizedInitialData.content ||
    JSON.stringify(formData.faq) !== JSON.stringify(normalizedInitialData.faq);

  const isFormValid =
    formData.name.trim() !== "" &&
    formData.slug.trim() !== "" &&
    formData.title.trim() !== "" &&
    formData.h1.trim() !== "" &&
    formData.metaDesc.trim() !== "" &&
    formData.content.replace(/<[^>]*>?/gm, "").trim() !== "";

  return (
    <div className="bg-brand-surface border border-brand-border rounded-brand-lg p-4 space-y-5 overflow-x-hidden sm:p-6 sm:space-y-6">
      <h2 className="font-heading font-bold text-text-primary text-lg border-b border-brand-border pb-4">
        {d.generatorTitle}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id={`${entity}-name`}
          label={d.formName}
          value={formData.name}
          onChange={(event) => {
            const newName = event.target.value;
            setFormData((prev) => ({
              ...prev,
              name: newName,
              slug: !initialData ? createEntitySlug(entity, newName) : prev.slug,
            }));
          }}
          placeholder={d.formNamePlaceholder}
        />

        <Input
          id={`${entity}-slug`}
          label={d.formSlug}
          value={formData.slug}
          onChange={(event) => updateField("slug", event.target.value)}
          placeholder={d.formSlugPlaceholder}
          disabled
          className="disabled:bg-surface-neutral/60 disabled:text-text-muted disabled:border-brand-border/60 disabled:cursor-not-allowed"
        />
      </div>

      <Textarea
        id={`${entity}-desc`}
        label={d.formDesc}
        value={formData.description}
        onChange={(event) => updateField("description", event.target.value)}
        rows={2}
      />

      <div className="space-y-3 rounded-xl border border-brand-border bg-surface-neutral p-4">
        <Input
          ref={imageInputRef}
          id={`${entity}-image`}
          type="file"
          label={d.imageUploadLabel}
          optionalText={d.imageUploadHelp}
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
        />

        {selectedImageFile && (
          <p className="text-sm text-text-secondary">
            {d.imageSelected.replace("{file}", selectedImageFile.name)}
          </p>
        )}

        {!selectedImageFile &&
          !isImageRemoved &&
          (formData.image || formData.imageUrl) && (
            <p className="text-sm text-text-secondary">{d.imageCurrent}</p>
          )}

        <Input
          id={`${entity}-image-alt`}
          label={d.imageAltLabel}
          value={imageAlt}
          onChange={(event) => setImageAlt(event.target.value)}
          placeholder={d.imageAltPlaceholder}
          disabled={!selectedImageFile && !formData.image}
        />

        {(selectedImageFile ||
          (!isImageRemoved && (formData.image || formData.imageUrl))) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
          >
            {d.imageRemove}
          </Button>
        )}
      </div>

      <div className="flex justify-stretch sm:justify-end">
        {mode === "create" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || !formData.name || !formData.slug}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {d.generatingBtn}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {d.generateBtn}
              </>
            )}
          </Button>
        )}
      </div>

      {feedback && <Alert variant={feedback.type} message={feedback.message} />}

      <div className="pt-4 border-t border-brand-border space-y-4">
        <Input
          id={`${entity}-title`}
          label={d.titleLabel}
          value={formData.title}
          onChange={(event) => updateField("title", event.target.value)}
        />

        <Textarea
          id={`${entity}-meta`}
          label={d.metaLabel}
          value={formData.metaDesc}
          onChange={(event) => updateField("metaDesc", event.target.value)}
          rows={2}
        />

        <Input
          id={`${entity}-h1`}
          label={d.h1Label}
          value={formData.h1}
          onChange={(event) => updateField("h1", event.target.value)}
        />

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-1">
            {d.contentLabel}
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

      <div className="pt-4 border-t border-brand-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-auto">
          {mode === "create" && (
            <Switch
              id={`${entity}-active`}
              label={d.isActive}
              checked={formData.isActive}
              onChange={(val) => updateField("isActive", val)}
            />
          )}
          {mode === "edit" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isGenerating || isSaving}
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {d.regeneratingBtn}
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {d.regenerateBtn}
                </>
              )}
            </Button>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
            disabled={!isFormValid || isGenerating}
            className="w-full sm:w-auto"
          >
            {DICTIONARY.admin.preview.button}
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || isGenerating || !isFormValid || !isDirty}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {d.saving}
              </>
            ) : (
              <>
                <Save size={16} />
                {d.save}
              </>
            )}
          </Button>
        </div>
      </div>

      <SeoEntityPreviewModal
        entity={entity}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={{
          ...formData,
          image:
            !isImageRemoved && formData.image
              ? { ...formData.image, alt: imageAlt.trim() || getDefaultImageAlt() }
              : undefined,
          imageUrl: isImageRemoved ? undefined : formData.imageUrl,
        }}
      />
    </div>
  );
};
