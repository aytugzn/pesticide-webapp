"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, Loader2, Save, Edit, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DICTIONARY } from "@/constants/dictionary";
import { useCombinationAdminToast } from "@/features/combinations/components/admin/CombinationJobProvider";
import { uploadAdminImage } from "@/features/image-upload/actions";
import { AdminImageUploadField } from "@/features/image-upload/components/admin/AdminImageUploadField";
import { saveSiteImages } from "@/features/settings/actions";
import { SITE_IMAGE_GROUP_MAX_IMAGES } from "@/features/settings/constants";
import type { HeroSlideDoc } from "@/features/home/types";
import type { AppImage } from "@/types";
import { resolveAppImage } from "@/utils/cloudinary";

type SlideDraft = {
  key: string;
  id?: string;
  image?: AppImage;
  imageUrl?: string;
  alt: string;
  selectedFile: File | null;
};

type SiteImagesFormProps = {
  initialHeroSlides: HeroSlideDoc[];
  initialWhyUsSlides?: AppImage[];
  initialServicesSlides?: AppImage[];
};

type SiteUploadTarget = "site-hero" | "site-why-us" | "site-services";

/**
 * Creates draft state objects for image arrays.
 * Extracts correct ID, image, and alt text for both HeroSlideDocs and raw AppImages.
 * @param slides - The initial array of slides or images
 * @param prefix - Prefix for draft keys
 * @returns Array of initialized slide drafts
 */
const createSlideDrafts = (
  slides: Array<HeroSlideDoc | AppImage>,
  prefix: string,
): SlideDraft[] =>
  slides.map((slide, index) => {
    // Handle both HeroSlideDoc and raw AppImage (for services/whyUs arrays)
    const isHeroSlide = "order" in slide;
    const id = isHeroSlide ? slide.id : undefined;
    const image = isHeroSlide ? slide.image : (slide as AppImage);
    const imageUrl = isHeroSlide ? slide.imageUrl : undefined;
    const altText = isHeroSlide ? slide.altText : slide.alt;

    return {
      key: id || `${prefix}-${index}`,
      id,
      image,
      imageUrl,
      alt: image?.alt || altText || "",
      selectedFile: null,
    };
  });

/**
 * Creates a JSON snapshot of the form drafts for dirty checking.
 * Only tracks essential fields like id, image, alt, and selected file metadata.
 * @param heroDrafts - Hero section drafts
 * @param whyUsDrafts - Why Us section drafts
 * @param servicesDrafts - Services section drafts
 * @returns Serialized JSON string of the form state
 */
const createFormSnapshot = (
  heroDrafts: SlideDraft[],
  whyUsDrafts: SlideDraft[],
  servicesDrafts: SlideDraft[],
) =>
  JSON.stringify({
    hero: heroDrafts.map((draft) => ({
      id: draft.id,
      image: draft.image,
      imageUrl: draft.imageUrl,
      alt: draft.alt.trim(),
      file: draft.selectedFile
        ? [
            draft.selectedFile.name,
            draft.selectedFile.size,
            draft.selectedFile.lastModified,
          ]
        : null,
    })),
    whyUs: whyUsDrafts.map((draft) => ({
      id: draft.id,
      image: draft.image,
      imageUrl: draft.imageUrl,
      alt: draft.alt.trim(),
      file: draft.selectedFile
        ? [
            draft.selectedFile.name,
            draft.selectedFile.size,
            draft.selectedFile.lastModified,
          ]
        : null,
    })),
    services: servicesDrafts.map((draft) => ({
      id: draft.id,
      image: draft.image,
      imageUrl: draft.imageUrl,
      alt: draft.alt.trim(),
      file: draft.selectedFile
        ? [
            draft.selectedFile.name,
            draft.selectedFile.size,
            draft.selectedFile.lastModified,
          ]
        : null,
    })),
  });

const CompactSlideCard = ({
  draft,
  title,
  defaultAlt,
  onEdit,
  onRemoveCard,
  removeCardLabel,
  d,
}: {
  draft: SlideDraft;
  title: string;
  defaultAlt: string;
  onEdit: () => void;
  onRemoveCard: () => void;
  removeCardLabel: string;
  d: typeof DICTIONARY.admin.settings.siteImages.compactCard;
}) => {
  const hasImage = Boolean(draft.image || draft.imageUrl || draft.selectedFile);
  const isPending = Boolean(draft.selectedFile);
  const altText = draft.alt.trim() || defaultAlt;

  const thumbUrl = useMemo(() => {
    if (draft.selectedFile) {
      return URL.createObjectURL(draft.selectedFile);
    }

    if (draft.image || draft.imageUrl) {
      const resolved = resolveAppImage({
        image: draft.image,
        imageUrl: draft.imageUrl,
        fallbackAlt: altText,
        preset: "thumbnail",
      });
      return resolved?.url || "";
    }

    return "";
  }, [altText, draft.image, draft.imageUrl, draft.selectedFile]);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (draft.selectedFile && thumbUrl) {
        URL.revokeObjectURL(thumbUrl);
      }
    };
  }, [draft.selectedFile, thumbUrl]);

  return (
    <div className="flex items-center gap-4 rounded-brand-md border border-brand-border bg-surface-neutral p-3 transition-colors hover:border-brand-primary/50 min-w-0">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-brand-border/50 bg-brand-surface sm:h-16 sm:w-16">
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized={!!draft.selectedFile}
          />
        ) : (
          <ImageIcon className="h-6 w-6 text-text-muted" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="truncate text-sm font-semibold text-text-primary">
            {title}
          </h4>
          {isPending && (
            <span className="shrink-0 rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-bold text-brand-primary">
              {d.badgeNew}
            </span>
          )}
          {!hasImage && (
            <span className="shrink-0 rounded-full bg-error-surface px-2 py-0.5 text-xs font-bold text-error-text">
              {d.badgeMissing}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-text-secondary">
          {draft.selectedFile
            ? draft.selectedFile.name
            : altText || d.noAltText}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="h-8 px-3 text-xs"
        >
          <Edit className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{d.edit}</span>
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onRemoveCard}
          className="h-8 px-2"
          title={removeCardLabel}
          aria-label={removeCardLabel}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};

/**
 * Checks if all drafts in a section have an image, imageUrl, or selected file.
 * @param drafts - Drafts to check
 * @returns True if all drafts are complete
 */
const checkComplete = (drafts: SlideDraft[]) =>
  drafts.every(
    (draft) => Boolean(draft.image || draft.imageUrl || draft.selectedFile),
  );

/**
 * Resolves the optimal thumbnail URL for an image draft.
 * @param id - Image ID
 * @param image - AppImage object if present
 * @param imageUrl - External image URL if present
 * @param fallbackAlt - Fallback alt text
 * @returns Resolved thumbnail object or null
 */
const getCurrentImage = (
  id: string,
  image?: AppImage,
  imageUrl?: string,
  fallbackAlt = "",
) => {
  const resolved = resolveAppImage({
    image,
    imageUrl,
    fallbackAlt,
    preset: "thumbnail",
  });

  return resolved
    ? { id, url: resolved.url, altText: resolved.alt }
    : null;
};

type ExpandedSlideCardProps = {
  idPrefix: SiteUploadTarget;
  draft: SlideDraft;
  title: string;
  helpText: string;
  defaultAlt: string;
  removeCardLabel: string;
  onCollapse: () => void;
  onFileSelect: (file: File) => void;
  onAltChange: (alt: string) => void;
  onRemoveCard: () => void;
  onValidationError: () => void;
};

/**
 * Renders the shared expanded editor used by each site image group.
 *
 * @param props - Draft image state and group-specific callbacks.
 * @returns The expanded image upload editor card.
 */
const ExpandedSlideCard = ({
  idPrefix,
  draft,
  title,
  helpText,
  defaultAlt,
  removeCardLabel,
  onCollapse,
  onFileSelect,
  onAltChange,
  onRemoveCard,
  onValidationError,
}: ExpandedSlideCardProps) => {
  const d = DICTIONARY.admin.settings.siteImages;

  return (
    <div className="space-y-4 rounded-brand-md border border-brand-border bg-surface-neutral p-2 sm:p-4 min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <h4 className="font-semibold text-text-primary text-sm truncate min-w-0 flex-1">
          {title} - {d.compactCard.editing}
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onCollapse}
        >
          {d.compactCard.collapse}
        </Button>
      </div>
      <AdminImageUploadField
        id={`${idPrefix}-${draft.key}`}
        label={title}
        helpText={helpText}
        currentImage={
          draft.selectedFile
            ? null
            : getCurrentImage(
                `${draft.key}-current`,
                draft.image,
                draft.imageUrl,
                draft.alt || defaultAlt,
              )
        }
        selectedFile={draft.selectedFile}
        alt={draft.alt}
        altLabel={d.altLabel}
        altPlaceholder={d.altPlaceholder}
        altDisabled={!draft.image && !draft.imageUrl && !draft.selectedFile}
        subtleDropzone
        onFileSelect={onFileSelect}
        onAltChange={onAltChange}
        onRemoveCard={onRemoveCard}
        removeCardLabel={removeCardLabel}
        onValidationError={onValidationError}
      />
    </div>
  );
};

export const SiteImagesForm = ({
  initialHeroSlides,
  initialWhyUsSlides = [],
  initialServicesSlides = [],
}: SiteImagesFormProps) => {
  const router = useRouter();
  const { showToast, showToastSequence } = useCombinationAdminToast();
  const d = DICTIONARY.admin.settings.siteImages;

  const [heroDrafts, setHeroDrafts] = useState(() =>
    createSlideDrafts(initialHeroSlides, "hero"),
  );
  const [whyUsDrafts, setWhyUsDrafts] = useState(() =>
    createSlideDrafts(initialWhyUsSlides, "whyUs"),
  );
  const [servicesDrafts, setServicesDrafts] = useState(() =>
    createSlideDrafts(initialServicesSlides, "services"),
  );

  const [newHeroIndex, setNewHeroIndex] = useState(0);
  const [newWhyUsIndex, setNewWhyUsIndex] = useState(0);
  const [newServicesIndex, setNewServicesIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const initialSnapshot = createFormSnapshot(
    createSlideDrafts(initialHeroSlides, "hero"),
    createSlideDrafts(initialWhyUsSlides, "whyUs"),
    createSlideDrafts(initialServicesSlides, "services"),
  );
  const currentSnapshot = createFormSnapshot(
    heroDrafts,
    whyUsDrafts,
    servicesDrafts,
  );
  const isDirty = currentSnapshot !== initialSnapshot;

  const heroDraftsComplete = checkComplete(heroDrafts);
  const whyUsDraftsComplete = checkComplete(whyUsDrafts);
  const servicesDraftsComplete = checkComplete(servicesDrafts);

  const allComplete =
    heroDraftsComplete && whyUsDraftsComplete && servicesDraftsComplete;

  const uploadFile = async (
    target: SiteUploadTarget,
    file: File,
    alt: string,
  ) => {
    const uploadData = new FormData();
    uploadData.set("target", target);
    uploadData.set("file", file);
    uploadData.set("alt", alt);
    return uploadAdminImage(uploadData);
  };

  const processDrafts = async (
    drafts: SlideDraft[],
    target: SiteUploadTarget,
    defaultAlt: string,
  ): Promise<{ ok: true; value: HeroSlideDoc[] } | { ok: false }> => {
    const savedSlides: HeroSlideDoc[] = [];
    for (let index = 0; index < drafts.length; index++) {
      const draft = drafts[index];
      const alt = draft.alt.trim() || defaultAlt;
      let image = draft.image;
      let imageUrl = draft.imageUrl;

      if (draft.selectedFile) {
        const uploadResult = await uploadFile(target, draft.selectedFile, alt);
        if (!uploadResult.success || !uploadResult.data) {
          return { ok: false };
        }
        image = uploadResult.data;
        imageUrl = undefined;
      } else if (image && image.alt !== alt) {
        image = { ...image, alt };
      }

      savedSlides.push({
        id: draft.id || image?.assetId || image?.publicId || draft.key,
        ...(image ? { image } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        altText: alt,
        order: index,
      });
    }
    return { ok: true, value: savedSlides };
  };

  const handleSave = async () => {
    if (!isDirty || !allComplete) return;

    setIsSaving(true);

    try {
      const heroResult = await processDrafts(
        heroDrafts,
        "site-hero",
        d.heroAltDefault,
      );
      if (!heroResult.ok) {
        showToast({ variant: "error", message: d.uploadError });
        setIsSaving(false);
        return;
      }

      const whyUsResult = await processDrafts(
        whyUsDrafts,
        "site-why-us",
        d.whyUsAltDefault,
      );
      if (!whyUsResult.ok) {
        showToast({ variant: "error", message: d.uploadError });
        setIsSaving(false);
        return;
      }

      const servicesResult = await processDrafts(
        servicesDrafts,
        "site-services",
        d.servicesAltDefault,
      );
      if (!servicesResult.ok) {
        showToast({ variant: "error", message: d.uploadError });
        setIsSaving(false);
        return;
      }

      const result = await saveSiteImages({
        heroSlides: heroResult.value,
        whyUsSlides: whyUsResult.value,
        servicesSlides: servicesResult.value,
      });

      if (!result.success) {
        showToast({ variant: "error", message: d.error });
        return;
      }

      if (result.data?.cleanupStatus === "success") {
        showToastSequence([
          { variant: "success", message: d.success },
          { variant: "success", message: d.cleanupSuccess },
        ]);
      } else if (result.data?.cleanupStatus === "partial-failure") {
        showToastSequence([
          { variant: "success", message: d.success },
          { variant: "warning", message: d.cleanupWarning },
        ]);
      } else {
        showToast({ variant: "success", message: d.success });
      }
      router.refresh();
    } catch {
      showToast({ variant: "error", message: d.error });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-8 rounded-brand-lg border border-brand-border bg-brand-surface p-4 sm:p-6 min-w-0">
      <header className="space-y-2 border-b border-brand-border pb-4">
        <h2 className="font-heading text-xl font-bold text-text-primary">
          {d.title}
        </h2>
        <p className="text-sm text-text-secondary">{d.description}</p>
      </header>

      {/* Hero Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-heading text-lg font-bold text-text-primary">
              {d.heroTitle}
            </h3>
            <span className="rounded-full bg-brand-surface-muted px-3 py-1 text-xs font-medium text-text-secondary">
              {d.limitCount.replace("{current}", String(heroDrafts.length)).replace("{max}", String(SITE_IMAGE_GROUP_MAX_IMAGES))}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={heroDrafts.length >= SITE_IMAGE_GROUP_MAX_IMAGES}
            title={heroDrafts.length >= SITE_IMAGE_GROUP_MAX_IMAGES ? d.limitReached.replace("{max}", String(SITE_IMAGE_GROUP_MAX_IMAGES)) : undefined}
            onClick={() => {
              const nextKey = `new-hero-${newHeroIndex}`;
              setNewHeroIndex((current) => current + 1);
              setHeroDrafts((current) => [
                ...current,
                { key: nextKey, alt: "", selectedFile: null },
              ]);
              setExpandedKey(nextKey);
            }}
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {d.addHero}
          </Button>
        </div>

        <div className="grid gap-3 min-w-0">
          {heroDrafts.map((draft, index) => {
              const title = d.heroItemTitle.replace("{number}", String(index + 1));
            const isExpanded = expandedKey === draft.key;

            if (!isExpanded) {
              return (
                <CompactSlideCard
                  key={draft.key}
                  draft={draft}
                  title={title}
                  defaultAlt={d.heroAltDefault}
                  d={d.compactCard}
                  onEdit={() => setExpandedKey(draft.key)}
                  onRemoveCard={() => {
                    setHeroDrafts((current) =>
                      current.filter((item) => item.key !== draft.key),
                    );
                    if (expandedKey === draft.key) setExpandedKey(null);
                  }}
                  removeCardLabel={d.removeHero}
                />
              );
            }

            return (
              <ExpandedSlideCard
                key={draft.key}
                idPrefix="site-hero"
                draft={draft}
                title={title}
                helpText={d.heroHelp}
                defaultAlt={d.heroAltDefault}
                removeCardLabel={d.removeHero}
                onCollapse={() => setExpandedKey(null)}
                onFileSelect={(file) =>
                  setHeroDrafts((current) =>
                    current.map((item) =>
                      item.key === draft.key
                        ? { ...item, selectedFile: file }
                        : item,
                    ),
                  )
                }
                onAltChange={(alt) =>
                  setHeroDrafts((current) =>
                    current.map((item) =>
                      item.key === draft.key ? { ...item, alt } : item,
                    ),
                  )
                }
                onRemoveCard={() => {
                  setHeroDrafts((current) =>
                    current.filter((item) => item.key !== draft.key),
                  );
                  setExpandedKey(null);
                }}
                onValidationError={() =>
                  showToast({ variant: "error", message: d.validationError })
                }
              />
            );
          })}
        </div>

        {!heroDraftsComplete && (
          <p className="text-sm text-error-text">{d.incompleteHero}</p>
        )}
      </div>

      <hr className="border-brand-border" />

      {/* Services Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-heading text-lg font-bold text-text-primary">
              {d.servicesTitle}
            </h3>
            <span className="rounded-full bg-brand-surface-muted px-3 py-1 text-xs font-medium text-text-secondary">
              {d.limitCount.replace("{current}", String(servicesDrafts.length)).replace("{max}", String(SITE_IMAGE_GROUP_MAX_IMAGES))}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={servicesDrafts.length >= SITE_IMAGE_GROUP_MAX_IMAGES}
            title={servicesDrafts.length >= SITE_IMAGE_GROUP_MAX_IMAGES ? d.limitReached.replace("{max}", String(SITE_IMAGE_GROUP_MAX_IMAGES)) : undefined}
            onClick={() => {
              const nextKey = `new-services-${newServicesIndex}`;
              setNewServicesIndex((current) => current + 1);
              setServicesDrafts((current) => [
                ...current,
                { key: nextKey, alt: "", selectedFile: null },
              ]);
              setExpandedKey(nextKey);
            }}
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {d.addServices}
          </Button>
        </div>

        <div className="grid gap-3 min-w-0">
          {servicesDrafts.map((draft, index) => {
              const title = d.servicesItemTitle.replace("{number}", String(index + 1));
            const isExpanded = expandedKey === draft.key;

            if (!isExpanded) {
              return (
                <CompactSlideCard
                  key={draft.key}
                  draft={draft}
                  title={title}
                  defaultAlt={d.servicesAltDefault}
                  d={d.compactCard}
                  onEdit={() => setExpandedKey(draft.key)}
                  onRemoveCard={() => {
                    setServicesDrafts((current) =>
                      current.filter((item) => item.key !== draft.key),
                    );
                    if (expandedKey === draft.key) setExpandedKey(null);
                  }}
                  removeCardLabel={d.removeServices}
                />
              );
            }

            return (
              <ExpandedSlideCard
                key={draft.key}
                idPrefix="site-services"
                draft={draft}
                title={title}
                helpText={d.servicesHelp}
                defaultAlt={d.servicesAltDefault}
                removeCardLabel={d.removeServices}
                onCollapse={() => setExpandedKey(null)}
                onFileSelect={(file) =>
                  setServicesDrafts((current) =>
                    current.map((item) =>
                      item.key === draft.key
                        ? { ...item, selectedFile: file }
                        : item,
                    ),
                  )
                }
                onAltChange={(alt) =>
                  setServicesDrafts((current) =>
                    current.map((item) =>
                      item.key === draft.key ? { ...item, alt } : item,
                    ),
                  )
                }
                onRemoveCard={() => {
                  setServicesDrafts((current) =>
                    current.filter((item) => item.key !== draft.key),
                  );
                  setExpandedKey(null);
                }}
                onValidationError={() =>
                  showToast({ variant: "error", message: d.validationError })
                }
              />
            );
          })}
        </div>

        {!servicesDraftsComplete && (
          <p className="text-sm text-error-text">{d.incompleteServices}</p>
        )}
      </div>

      <hr className="border-brand-border" />

      {/* Why Us Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-heading text-lg font-bold text-text-primary">
              {d.whyUsTitle}
            </h3>
            <span className="rounded-full bg-brand-surface-muted px-3 py-1 text-xs font-medium text-text-secondary">
              {d.limitCount.replace("{current}", String(whyUsDrafts.length)).replace("{max}", String(SITE_IMAGE_GROUP_MAX_IMAGES))}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={whyUsDrafts.length >= SITE_IMAGE_GROUP_MAX_IMAGES}
            title={whyUsDrafts.length >= SITE_IMAGE_GROUP_MAX_IMAGES ? d.limitReached.replace("{max}", String(SITE_IMAGE_GROUP_MAX_IMAGES)) : undefined}
            onClick={() => {
              const nextKey = `new-why-us-${newWhyUsIndex}`;
              setNewWhyUsIndex((current) => current + 1);
              setWhyUsDrafts((current) => [
                ...current,
                { key: nextKey, alt: "", selectedFile: null },
              ]);
              setExpandedKey(nextKey);
            }}
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {d.addWhyUs}
          </Button>
        </div>

        <div className="grid gap-3 min-w-0">
          {whyUsDrafts.map((draft, index) => {
              const title = d.whyUsItemTitle.replace("{number}", String(index + 1));
            const isExpanded = expandedKey === draft.key;

            if (!isExpanded) {
              return (
                <CompactSlideCard
                  key={draft.key}
                  draft={draft}
                  title={title}
                  defaultAlt={d.whyUsAltDefault}
                  d={d.compactCard}
                  onEdit={() => setExpandedKey(draft.key)}
                  onRemoveCard={() => {
                    setWhyUsDrafts((current) =>
                      current.filter((item) => item.key !== draft.key),
                    );
                    if (expandedKey === draft.key) setExpandedKey(null);
                  }}
                  removeCardLabel={d.removeWhyUs}
                />
              );
            }

            return (
              <ExpandedSlideCard
                key={draft.key}
                idPrefix="site-why-us"
                draft={draft}
                title={title}
                helpText={d.whyUsHelp}
                defaultAlt={d.whyUsAltDefault}
                removeCardLabel={d.removeWhyUs}
                onCollapse={() => setExpandedKey(null)}
                onFileSelect={(file) =>
                  setWhyUsDrafts((current) =>
                    current.map((item) =>
                      item.key === draft.key
                        ? { ...item, selectedFile: file }
                        : item,
                    ),
                  )
                }
                onAltChange={(alt) =>
                  setWhyUsDrafts((current) =>
                    current.map((item) =>
                      item.key === draft.key ? { ...item, alt } : item,
                    ),
                  )
                }
                onRemoveCard={() => {
                  setWhyUsDrafts((current) =>
                    current.filter((item) => item.key !== draft.key),
                  );
                  setExpandedKey(null);
                }}
                onValidationError={() =>
                  showToast({ variant: "error", message: d.validationError })
                }
              />
            );
          })}
        </div>

        {!whyUsDraftsComplete && (
          <p className="text-sm text-error-text">{d.incompleteWhyUs}</p>
        )}
      </div>

      <div className="flex justify-end border-t border-brand-border pt-4">
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          disabled={isSaving || !isDirty || !allComplete}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {d.saving}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden="true" />
              {d.save}
            </>
          )}
        </Button>
      </div>
    </section>
  );
};
