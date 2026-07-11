"use client";

import { useEffect, useMemo, type ChangeEvent } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageSlider, type SliderImage } from "@/components/ui/ImageSlider";
import { Input } from "@/components/ui/Input";
import { DICTIONARY } from "@/constants/dictionary";
import type { ImageUploadErrorCode } from "@/features/image-upload/types";

type ClientImageValidationError = Extract<
  ImageUploadErrorCode,
  "INVALID_FILE_TYPE" | "FILE_TOO_LARGE"
>;

type AdminImageUploadFieldProps = {
  id: string;
  label: string;
  helpText: string;
  currentImage?: SliderImage | null;
  selectedFile: File | null;
  alt: string;
  altLabel: string;
  altPlaceholder: string;
  altDisabled?: boolean;
  onFileSelect: (file: File) => void;
  onAltChange: (alt: string) => void;
  onRemove: () => void;
  onValidationError: (error: ClientImageValidationError) => void;
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Formats a byte count for compact admin file details.
 *
 * @param bytes - File size in bytes
 * @returns A localized megabyte label
 */
const formatFileSize = (bytes: number) =>
  `${(bytes / (1024 * 1024)).toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
  })} MB`;

/**
 * Reusable themed image picker for admin-managed entity and site visuals.
 */
export const AdminImageUploadField = ({
  id,
  label,
  helpText,
  currentImage,
  selectedFile,
  alt,
  altLabel,
  altPlaceholder,
  altDisabled = false,
  onFileSelect,
  onAltChange,
  onRemove,
  onValidationError,
}: AdminImageUploadFieldProps) => {
  const d = DICTIONARY.admin.imageUpload;
  const selectedPreviewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    return () => {
      if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
    };
  }, [selectedPreviewUrl]);

  const previewImage = selectedPreviewUrl
    ? {
        id: `${id}-selected`,
        url: selectedPreviewUrl,
        altText: alt.trim() || selectedFile?.name || label,
      }
    : currentImage;
  const hasImage = Boolean(selectedFile || currentImage);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      onValidationError("INVALID_FILE_TYPE");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      onValidationError("FILE_TOO_LARGE");
      return;
    }

    onFileSelect(file);
  };

  return (
    <section className="space-y-4 rounded-brand-lg border border-brand-border bg-surface-neutral p-4">
      <header className="space-y-1">
        <h3 className="text-sm font-bold text-text-primary">{label}</h3>
        <p className="text-xs text-text-muted">{helpText}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
        <div className="relative min-h-52 overflow-hidden rounded-brand-md border border-brand-border bg-brand-surface">
          <ImageSlider images={previewImage ? [previewImage] : []} autoplayDelay={0} />
          {!hasImage && (
            <ImagePlus
              className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-text-muted"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="flex flex-col justify-center gap-3">
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
          />

          <label
            htmlFor={id}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-brand-md bg-brand-primary px-4 text-sm font-medium text-brand-surface transition-colors hover:bg-brand-primary-hover"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {hasImage ? d.replace : d.choose}
          </label>

          {selectedFile && (
            <p className="rounded-brand-md border border-brand-border bg-brand-surface px-3 py-2 text-xs text-text-secondary">
              {d.selectedFile
                .replace("{name}", selectedFile.name)
                .replace("{size}", formatFileSize(selectedFile.size))}
            </p>
          )}

          {hasImage && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {d.remove}
            </Button>
          )}
        </div>
      </div>

      <Input
        id={`${id}-alt`}
        label={altLabel}
        value={alt}
        onChange={(event) => onAltChange(event.target.value)}
        placeholder={altPlaceholder}
        disabled={altDisabled}
      />
    </section>
  );
};
