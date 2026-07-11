"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Save } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { DICTIONARY } from "@/constants/dictionary";
import { uploadAdminImage } from "@/features/image-upload/actions";
import { AdminImageUploadField } from "@/features/image-upload/components/admin/AdminImageUploadField";
import { saveSiteImages } from "@/features/settings/actions";
import type { HeroSlideDoc } from "@/features/home/types";
import type { AppImage } from "@/types";
import { resolveAppImage } from "@/utils/cloudinary";

type HeroImageDraft = {
  key: string;
  id?: string;
  image?: AppImage;
  imageUrl?: string;
  alt: string;
  selectedFile: File | null;
};

type SingleImageDraft = {
  image?: AppImage;
  alt: string;
  selectedFile: File | null;
  removed: boolean;
};

type SiteImagesFormProps = {
  initialHeroSlides: HeroSlideDoc[];
  initialWhyUsImage?: AppImage;
  initialServicesImage?: AppImage;
};

type Feedback = { type: "success" | "error"; message: string } | null;

type SiteUploadTarget = "site-hero" | "site-why-us" | "site-services";

const createHeroDrafts = (slides: HeroSlideDoc[]): HeroImageDraft[] =>
  slides.map((slide, index) => ({
    key: slide.id || `hero-${index}`,
    id: slide.id,
    image: slide.image,
    imageUrl: slide.imageUrl,
    alt: slide.image?.alt || slide.altText || "",
    selectedFile: null,
  }));

const createSingleDraft = (image?: AppImage): SingleImageDraft => ({
  image,
  alt: image?.alt || "",
  selectedFile: null,
  removed: false,
});

/**
 * Produces a stable comparison snapshot that ignores meaningless alt whitespace.
 */
const createFormSnapshot = (
  heroDrafts: HeroImageDraft[],
  whyUsDraft: SingleImageDraft,
  servicesDraft: SingleImageDraft,
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
    whyUs: {
      image: whyUsDraft.image,
      alt: whyUsDraft.alt.trim(),
      removed: whyUsDraft.removed,
      file: whyUsDraft.selectedFile
        ? [
            whyUsDraft.selectedFile.name,
            whyUsDraft.selectedFile.size,
            whyUsDraft.selectedFile.lastModified,
          ]
        : null,
    },
    services: {
      image: servicesDraft.image,
      alt: servicesDraft.alt.trim(),
      removed: servicesDraft.removed,
      file: servicesDraft.selectedFile
        ? [
            servicesDraft.selectedFile.name,
            servicesDraft.selectedFile.size,
            servicesDraft.selectedFile.lastModified,
          ]
        : null,
    },
  });

/**
 * Uploads and stores the admin-managed Hero, WhyUs, and Services visuals.
 */
export const SiteImagesForm = ({
  initialHeroSlides,
  initialWhyUsImage,
  initialServicesImage,
}: SiteImagesFormProps) => {
  const router = useRouter();
  const d = DICTIONARY.admin.settings.siteImages;
  const [heroDrafts, setHeroDrafts] = useState(() =>
    createHeroDrafts(initialHeroSlides),
  );
  const [whyUsDraft, setWhyUsDraft] = useState(() =>
    createSingleDraft(initialWhyUsImage),
  );
  const [servicesDraft, setServicesDraft] = useState(() =>
    createSingleDraft(initialServicesImage),
  );
  const [newHeroIndex, setNewHeroIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const initialSnapshot = createFormSnapshot(
    createHeroDrafts(initialHeroSlides),
    createSingleDraft(initialWhyUsImage),
    createSingleDraft(initialServicesImage),
  );
  const currentSnapshot = createFormSnapshot(
    heroDrafts,
    whyUsDraft,
    servicesDraft,
  );
  const isDirty = currentSnapshot !== initialSnapshot;
  const heroDraftsComplete = heroDrafts.every(
    (draft) => Boolean(draft.image || draft.imageUrl || draft.selectedFile),
  );

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

  const handleSave = async () => {
    if (!isDirty || !heroDraftsComplete) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      const savedHeroSlides = [];

      for (let index = 0; index < heroDrafts.length; index++) {
        const draft = heroDrafts[index];
        const alt = draft.alt.trim() || d.heroAltDefault;
        let image = draft.image;
        let imageUrl = draft.imageUrl;

        if (draft.selectedFile) {
          const uploadResult = await uploadFile(
            "site-hero",
            draft.selectedFile,
            alt,
          );

          if (!uploadResult.success || !uploadResult.data) {
            setFeedback({ type: "error", message: d.error });
            return;
          }

          image = uploadResult.data;
          imageUrl = undefined;
        } else if (image && image.alt !== alt) {
          image = { ...image, alt };
        }

        savedHeroSlides.push({
          id: draft.id || image?.assetId || image?.publicId || draft.key,
          ...(image ? { image } : {}),
          ...(imageUrl ? { imageUrl } : {}),
          altText: alt,
          order: index,
        });
      }

      let whyUsImage: AppImage | null | undefined = whyUsDraft.removed
        ? null
        : whyUsDraft.image;
      const whyUsAlt = whyUsDraft.alt.trim() || d.whyUsAltDefault;

      if (whyUsDraft.selectedFile) {
        const uploadResult = await uploadFile(
          "site-why-us",
          whyUsDraft.selectedFile,
          whyUsAlt,
        );

        if (!uploadResult.success || !uploadResult.data) {
          setFeedback({ type: "error", message: d.error });
          return;
        }

        whyUsImage = uploadResult.data;
      } else if (whyUsImage && whyUsImage.alt !== whyUsAlt) {
        whyUsImage = { ...whyUsImage, alt: whyUsAlt };
      }

      let servicesImage: AppImage | null | undefined = servicesDraft.removed
        ? null
        : servicesDraft.image;
      const servicesAlt = servicesDraft.alt.trim() || d.servicesAltDefault;

      if (servicesDraft.selectedFile) {
        const uploadResult = await uploadFile(
          "site-services",
          servicesDraft.selectedFile,
          servicesAlt,
        );

        if (!uploadResult.success || !uploadResult.data) {
          setFeedback({ type: "error", message: d.error });
          return;
        }

        servicesImage = uploadResult.data;
      } else if (servicesImage && servicesImage.alt !== servicesAlt) {
        servicesImage = { ...servicesImage, alt: servicesAlt };
      }

      const result = await saveSiteImages({
        heroSlides: savedHeroSlides,
        ...(whyUsImage !== undefined ? { whyUsImage } : {}),
        ...(servicesImage !== undefined ? { servicesImage } : {}),
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
    <section className="space-y-6 rounded-brand-lg border border-brand-border bg-brand-surface p-4 sm:p-6">
      <header className="space-y-2 border-b border-brand-border pb-4">
        <h2 className="font-heading text-xl font-bold text-text-primary">
          {d.title}
        </h2>
        <p className="text-sm text-text-secondary">{d.description}</p>
      </header>

      {feedback && <Alert variant={feedback.type} message={feedback.message} />}

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
                {
                  key: nextKey,
                  alt: "",
                  selectedFile: null,
                },
              ]);
            }}
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {d.addHero}
          </Button>
        </div>

        {heroDrafts.map((draft, index) => (
          <AdminImageUploadField
            key={draft.key}
            id={`site-hero-${draft.key}`}
            label={d.heroItemTitle.replace("{number}", String(index + 1))}
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
            onRemove={() =>
              setHeroDrafts((current) =>
                current.filter((item) => item.key !== draft.key),
              )
            }
            onValidationError={() =>
              setFeedback({ type: "error", message: d.error })
            }
          />
        ))}

        {!heroDraftsComplete && (
          <p className="text-sm text-error-text">{d.incompleteHero}</p>
        )}
      </div>

      <AdminImageUploadField
        id="site-why-us"
        label={d.whyUsTitle}
        helpText={d.whyUsHelp}
        currentImage={
          whyUsDraft.removed || whyUsDraft.selectedFile
            ? null
            : getCurrentImage(
                "site-why-us-current",
                whyUsDraft.image,
                undefined,
                whyUsDraft.alt || d.whyUsAltDefault,
              )
        }
        selectedFile={whyUsDraft.selectedFile}
        alt={whyUsDraft.alt}
        altLabel={d.altLabel}
        altPlaceholder={d.altPlaceholder}
        altDisabled={
          !whyUsDraft.image && !whyUsDraft.selectedFile && !whyUsDraft.removed
        }
        onFileSelect={(file) =>
          setWhyUsDraft((current) => ({
            ...current,
            selectedFile: file,
            removed: false,
          }))
        }
        onAltChange={(alt) =>
          setWhyUsDraft((current) => ({ ...current, alt }))
        }
        onRemove={() =>
          setWhyUsDraft((current) => ({
            ...current,
            selectedFile: null,
            alt: "",
            removed: Boolean(current.image),
          }))
        }
        onValidationError={() =>
          setFeedback({ type: "error", message: d.error })
        }
      />

      <AdminImageUploadField
        id="site-services"
        label={d.servicesTitle}
        helpText={d.servicesHelp}
        currentImage={
          servicesDraft.removed || servicesDraft.selectedFile
            ? null
            : getCurrentImage(
                "site-services-current",
                servicesDraft.image,
                undefined,
                servicesDraft.alt || d.servicesAltDefault,
              )
        }
        selectedFile={servicesDraft.selectedFile}
        alt={servicesDraft.alt}
        altLabel={d.altLabel}
        altPlaceholder={d.altPlaceholder}
        altDisabled={
          !servicesDraft.image &&
          !servicesDraft.selectedFile &&
          !servicesDraft.removed
        }
        onFileSelect={(file) =>
          setServicesDraft((current) => ({
            ...current,
            selectedFile: file,
            removed: false,
          }))
        }
        onAltChange={(alt) =>
          setServicesDraft((current) => ({ ...current, alt }))
        }
        onRemove={() =>
          setServicesDraft((current) => ({
            ...current,
            selectedFile: null,
            alt: "",
            removed: Boolean(current.image),
          }))
        }
        onValidationError={() =>
          setFeedback({ type: "error", message: d.error })
        }
      />

      <div className="flex justify-end border-t border-brand-border pt-4">
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          disabled={isSaving || !isDirty || !heroDraftsComplete}
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
