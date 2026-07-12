"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, Loader2, Save, Edit, Trash2, ImageIcon } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { DICTIONARY } from "@/constants/dictionary";
import { uploadAdminImage } from "@/features/image-upload/actions";
import { AdminImageUploadField } from "@/features/image-upload/components/admin/AdminImageUploadField";
import { saveSiteImages } from "@/features/settings/actions";
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

type Feedback = { type: "success" | "error"; message: string } | null;
type SiteUploadTarget = "site-hero" | "site-why-us" | "site-services";

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
  onRemove,
  onRemoveCard,
  removeCardLabel,
  d,
}: {
  draft: SlideDraft;
  title: string;
  defaultAlt: string;
  onEdit: () => void;
  onRemove: () => void;
  onRemoveCard: () => void;
  removeCardLabel: string;
  d: typeof DICTIONARY.admin.settings.siteImages.compactCard;
}) => {
  const hasImage = Boolean(draft.image || draft.imageUrl || draft.selectedFile);
  const isPending = Boolean(draft.selectedFile);
  const altText = draft.alt.trim() || defaultAlt;

  // Resolve thumbnail
  let thumbUrl = "";
  if (draft.selectedFile) {
    thumbUrl = URL.createObjectURL(draft.selectedFile);
  } else if (draft.image || draft.imageUrl) {
    const resolved = resolveAppImage({
      image: draft.image,
      imageUrl: draft.imageUrl,
      fallbackAlt: altText,
      preset: "thumbnail",
    });
    thumbUrl = resolved?.url || "";
  }

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (draft.selectedFile && thumbUrl) {
        URL.revokeObjectURL(thumbUrl);
      }
    };
  }, [draft.selectedFile, thumbUrl]);

  return (
    <div className="flex items-center gap-4 rounded-brand-md border border-brand-border bg-surface-neutral p-3 transition-colors hover:border-brand-primary/50">
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
        <div className="flex items-center gap-2">
          <h4 className="truncate text-sm font-semibold text-text-primary">
            {title}
          </h4>
          {isPending && (
            <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-bold text-brand-primary">
              {d.badgeNew}
            </span>
          )}
          {!hasImage && (
            <span className="rounded-full bg-error-surface px-2 py-0.5 text-xs font-bold text-error-text">
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
        {hasImage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="h-8 px-2"
            title={d.removeImage}
            aria-label={d.removeImage}
          >
            <Trash2
              className="h-3.5 w-3.5 text-text-secondary"
              aria-hidden="true"
            />
          </Button>
        )}
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

export const SiteImagesForm = ({
  initialHeroSlides,
  initialWhyUsSlides = [],
  initialServicesSlides = [],
}: SiteImagesFormProps) => {
  const router = useRouter();
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
  const [feedback, setFeedback] = useState<Feedback>(null);
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

  const checkComplete = (drafts: SlideDraft[]) =>
    drafts.every(
      (draft) => Boolean(draft.image || draft.imageUrl || draft.selectedFile),
    );

  const heroDraftsComplete = checkComplete(heroDrafts);
  const whyUsDraftsComplete = checkComplete(whyUsDrafts);
  const servicesDraftsComplete = checkComplete(servicesDrafts);

  const allComplete =
    heroDraftsComplete && whyUsDraftsComplete && servicesDraftsComplete;

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
    setFeedback(null);

    try {
      const heroResult = await processDrafts(
        heroDrafts,
        "site-hero",
        d.heroAltDefault,
      );
      if (!heroResult.ok) {
        setFeedback({ type: "error", message: d.error });
        setIsSaving(false);
        return;
      }

      const whyUsResult = await processDrafts(
        whyUsDrafts,
        "site-why-us",
        d.whyUsAltDefault,
      );
      if (!whyUsResult.ok) {
        setFeedback({ type: "error", message: d.error });
        setIsSaving(false);
        return;
      }

      const servicesResult = await processDrafts(
        servicesDrafts,
        "site-services",
        d.servicesAltDefault,
      );
      if (!servicesResult.ok) {
        setFeedback({ type: "error", message: d.error });
        setIsSaving(false);
        return;
      }

      const result = await saveSiteImages({
        heroSlides: heroResult.value,
        whyUsSlides: whyUsResult.value,
        servicesSlides: servicesResult.value,
      });

      if (!result.success) {
        setFeedback({ type: "error", message: d.error });
        return;
      }

      setFeedback({ type: "success", message: d.success });
      router.refresh();
    } catch {
      setFeedback({ type: "error", message: d.error });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-12 rounded-brand-lg border border-brand-border bg-brand-surface p-4 sm:p-6">
      <header className="space-y-2 border-b border-brand-border pb-4">
        <h2 className="font-heading text-xl font-bold text-text-primary">
          {d.title}
        </h2>
        <p className="text-sm text-text-secondary">{d.description}</p>
      </header>

      {feedback && <Alert variant={feedback.type} message={feedback.message} />}

      {/* Hero Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-heading text-lg font-bold text-text-primary">
            {d.heroTitle}
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
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

        <div className="grid max-h-96 gap-3 overflow-y-auto pr-2 pb-2">
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
                  onRemove={() =>
                    setHeroDrafts((current) =>
                      current.map((item) =>
                        item.key === draft.key
                          ? {
                              ...item,
                              image: undefined,
                              imageUrl: undefined,
                              selectedFile: null,
                            }
                          : item,
                      ),
                    )
                  }
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
              <div key={draft.key} className="space-y-4 rounded-brand-md border-2 border-brand-primary/20 bg-brand-surface-muted p-2 sm:p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-text-primary text-sm">{title} - {d.compactCard.editing}</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => setExpandedKey(null)}>
                    {d.compactCard.collapse}
                  </Button>
                </div>
                <AdminImageUploadField
                  id={`site-hero-${draft.key}`}
                  label={title}
                  helpText={d.heroHelp}
                  currentImage={
                    draft.selectedFile
                      ? null
                      : getCurrentImage(
                          `${draft.key}-current`,
                          draft.image,
                          draft.imageUrl,
                          draft.alt || d.heroAltDefault,
                        )
                  }
                  selectedFile={draft.selectedFile}
                  alt={draft.alt}
                  altLabel={d.altLabel}
                  altPlaceholder={d.altPlaceholder}
                  altDisabled={!draft.image && !draft.imageUrl && !draft.selectedFile}
                  onFileSelect={(file) =>
                    setHeroDrafts((current) =>
                      current.map((item) =>
                        item.key === draft.key ? { ...item, selectedFile: file } : item,
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
                  onRemove={() =>
                    setHeroDrafts((current) =>
                      current.map((item) =>
                        item.key === draft.key
                          ? { ...item, image: undefined, imageUrl: undefined, selectedFile: null }
                          : item,
                      ),
                    )
                  }
                  onRemoveCard={() => {
                    setHeroDrafts((current) =>
                      current.filter((item) => item.key !== draft.key),
                    );
                    setExpandedKey(null);
                  }}
                  removeCardLabel={d.removeHero}
                  onValidationError={() =>
                    setFeedback({ type: "error", message: d.error })
                  }
                />
              </div>
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
          <h3 className="font-heading text-lg font-bold text-text-primary">
            {d.servicesTitle}
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
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

        <div className="grid max-h-96 gap-3 overflow-y-auto pr-2 pb-2">
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
                  onRemove={() =>
                    setServicesDrafts((current) =>
                      current.map((item) =>
                        item.key === draft.key
                          ? {
                              ...item,
                              image: undefined,
                              imageUrl: undefined,
                              selectedFile: null,
                            }
                          : item,
                      ),
                    )
                  }
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
              <div key={draft.key} className="space-y-4 rounded-brand-md border-2 border-brand-primary/20 bg-brand-surface-muted p-2 sm:p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-text-primary text-sm">{title} - {d.compactCard.editing}</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => setExpandedKey(null)}>
                    {d.compactCard.collapse}
                  </Button>
                </div>
                <AdminImageUploadField
                  id={`site-services-${draft.key}`}
                  label={title}
                  helpText={d.servicesHelp}
                  currentImage={
                    draft.selectedFile
                      ? null
                      : getCurrentImage(
                          `${draft.key}-current`,
                          draft.image,
                          draft.imageUrl,
                          draft.alt || d.servicesAltDefault,
                        )
                  }
                  selectedFile={draft.selectedFile}
                  alt={draft.alt}
                  altLabel={d.altLabel}
                  altPlaceholder={d.altPlaceholder}
                  altDisabled={!draft.image && !draft.imageUrl && !draft.selectedFile}
                  onFileSelect={(file) =>
                    setServicesDrafts((current) =>
                      current.map((item) =>
                        item.key === draft.key ? { ...item, selectedFile: file } : item,
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
                  onRemove={() =>
                    setServicesDrafts((current) =>
                      current.map((item) =>
                        item.key === draft.key
                          ? { ...item, image: undefined, imageUrl: undefined, selectedFile: null }
                          : item,
                      ),
                    )
                  }
                  onRemoveCard={() => {
                    setServicesDrafts((current) =>
                      current.filter((item) => item.key !== draft.key),
                    );
                    setExpandedKey(null);
                  }}
                  removeCardLabel={d.removeServices}
                  onValidationError={() =>
                    setFeedback({ type: "error", message: d.error })
                  }
                />
              </div>
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
          <h3 className="font-heading text-lg font-bold text-text-primary">
            {d.whyUsTitle}
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
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

        <div className="grid max-h-96 gap-3 overflow-y-auto pr-2 pb-2">
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
                  onRemove={() =>
                    setWhyUsDrafts((current) =>
                      current.map((item) =>
                        item.key === draft.key
                          ? {
                              ...item,
                              image: undefined,
                              imageUrl: undefined,
                              selectedFile: null,
                            }
                          : item,
                      ),
                    )
                  }
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
              <div key={draft.key} className="space-y-4 rounded-brand-md border-2 border-brand-primary/20 bg-brand-surface-muted p-2 sm:p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-text-primary text-sm">{title} - {d.compactCard.editing}</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => setExpandedKey(null)}>
                    {d.compactCard.collapse}
                  </Button>
                </div>
                <AdminImageUploadField
                  id={`site-why-us-${draft.key}`}
                  label={title}
                  helpText={d.whyUsHelp}
                  currentImage={
                    draft.selectedFile
                      ? null
                      : getCurrentImage(
                          `${draft.key}-current`,
                          draft.image,
                          draft.imageUrl,
                          draft.alt || d.whyUsAltDefault,
                        )
                  }
                  selectedFile={draft.selectedFile}
                  alt={draft.alt}
                  altLabel={d.altLabel}
                  altPlaceholder={d.altPlaceholder}
                  altDisabled={!draft.image && !draft.imageUrl && !draft.selectedFile}
                  onFileSelect={(file) =>
                    setWhyUsDrafts((current) =>
                      current.map((item) =>
                        item.key === draft.key ? { ...item, selectedFile: file } : item,
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
                  onRemove={() =>
                    setWhyUsDrafts((current) =>
                      current.map((item) =>
                        item.key === draft.key
                          ? { ...item, image: undefined, imageUrl: undefined, selectedFile: null }
                          : item,
                      ),
                    )
                  }
                  onRemoveCard={() => {
                    setWhyUsDrafts((current) =>
                      current.filter((item) => item.key !== draft.key),
                    );
                    setExpandedKey(null);
                  }}
                  removeCardLabel={d.removeWhyUs}
                  onValidationError={() =>
                    setFeedback({ type: "error", message: d.error })
                  }
                />
              </div>
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
