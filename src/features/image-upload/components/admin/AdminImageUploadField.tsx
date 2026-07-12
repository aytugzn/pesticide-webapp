"use client";

import { useEffect, useMemo, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageSlider, type SliderImage } from "@/components/ui/ImageSlider";
import { Input } from "@/components/ui/Input";
import { DICTIONARY } from "@/constants/dictionary";
import type { ImageUploadErrorCode } from "@/features/image-upload/types";
import { cn } from "@/utils/cn";

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
  onRemove?: () => void;
  onRemoveCard?: () => void;
  removeCardLabel?: string;
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
  onRemoveCard,
  removeCardLabel,
  onValidationError,
}: AdminImageUploadFieldProps) => {
  const d = DICTIONARY.admin.imageUpload;
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCardClick = () => {
    fileInputRef.current?.click();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <section className="space-y-4 rounded-brand-lg border border-brand-border bg-surface-neutral p-4 min-w-0">
      <header className="space-y-1 min-w-0">
        <h3 className="truncate text-sm font-bold text-text-primary">{label}</h3>
        <p className="truncate text-xs text-text-muted">{helpText}</p>
      </header>

      <div className="flex flex-col gap-4">
        {/* Clickable Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleCardClick}
          onKeyDown={handleCardKeyDown}
          aria-label={hasImage ? d.replaceHint : d.dropHint}
          className={cn(
            "group relative flex min-h-52 md:min-h-64 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-brand-md border-2 border-dashed border-brand-border bg-brand-surface transition-colors hover:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
            hasImage && "border-solid",
          )}
        >
          {previewImage ? (
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              <ImageSlider images={[previewImage]} autoplayDelay={0} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-text-muted">
              <ImagePlus className="h-8 w-8" aria-hidden="true" />
              <span className="text-sm font-medium">{d.dropHint}</span>
              <span className="text-xs">{d.formatHint}</span>
            </div>
          )}

          {/* Hover overlay hint for replacing */}
          {hasImage && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="flex items-center gap-2 rounded-full bg-surface-neutral px-4 py-2 text-sm font-medium text-text-primary shadow-sm">
                <Upload className="h-4 w-4" aria-hidden="true" />
                {d.replaceHint}
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFileChange}
          tabIndex={-1}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          {selectedFile ? (
            <p className="truncate rounded-brand-md border border-brand-border bg-brand-surface px-3 py-2 text-xs text-text-secondary min-w-0 flex-1">
              {d.selectedFile
                .replace("{name}", selectedFile.name)
                .replace("{size}", formatFileSize(selectedFile.size))}
            </p>
          ) : (
            <div className="min-w-0 flex-1" />
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:self-auto">
            {hasImage && onRemove && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRemove}
                className="self-start sm:self-auto"
              >
                <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
                {d.remove}
              </Button>
            )}
            {onRemoveCard && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={onRemoveCard}
                className="self-start sm:self-auto"
              >
                <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
                {removeCardLabel || d.remove}
              </Button>
            )}
          </div>
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
