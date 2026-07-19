import { DICTIONARY } from "@/constants/dictionary";
import { ImageSlider, type SliderImage } from "@/components/ui/ImageSlider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CheckListItem } from "@/components/ui/CheckListItem";
import { cn } from "@/utils/cn";
import type { AppImage, SiteImageSlideDoc } from "@/types";
import { resolveAppImage } from "@/utils/cloudinary";

type WhyUsSectionProps = {
  slides?: SiteImageSlideDoc[];
  legacyImage?: AppImage | null;
  autoplayDelay?: number;
  variant?: "default" | "embedded";
}

const BACKUP_WHY_US_SLIDES: SliderImage[] = [
  {
    id: "backup-why-us",
    url: "/backup/why-us.webp",
    altText: DICTIONARY.admin.settings.siteImages.whyUsAltDefault,
  },
];

export const WhyUsSection = ({
  slides,
  legacyImage = null,
  autoplayDelay,
  variant = "default",
}: WhyUsSectionProps) => {
  const data = DICTIONARY.home.whyUs;

  let sliderImages: SliderImage[] = [];

  if (slides && slides.length > 0) {
    sliderImages = slides
      .map((slide) => {
        const resolved = resolveAppImage({
          image: slide.image,
          imageUrl: slide.imageUrl,
          fallbackAlt:
            slide.altText ||
            DICTIONARY.admin.settings.siteImages.whyUsAltDefault,
          preset: "section",
        });
        return resolved
          ? {
              id: slide.id,
              url: resolved.url,
              altText: resolved.alt,
            }
          : null;
      })
      .filter((img) => img !== null) as SliderImage[];
  }

  if (sliderImages.length === 0 && legacyImage) {
    const resolvedImage = resolveAppImage({
      image: legacyImage,
      fallbackAlt: DICTIONARY.admin.settings.siteImages.whyUsAltDefault,
      preset: "section",
    });
    if (resolvedImage) {
      sliderImages = [
        {
          id: "why-us-legacy",
          url: resolvedImage.url,
          altText: resolvedImage.alt,
        },
      ];
    }
  }

  return (
    <section
      className={cn(
        "py-16 md:py-24",
        variant === "default" && "bg-brand-surface border-y border-brand-border",
        variant === "embedded" && "py-20 md:py-28",
      )}
      id="why-us"
      aria-labelledby="why-us-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left: Text & Image Content */}
          <div className="flex flex-col h-full">
            <SectionHeader
              id="why-us-heading"
              eyebrow={data.title}
              titlePrefix={data.titlePrefix}
              titleHighlight={data.titleHighlight}
              description={data.description}
            />

            {/* Image Frame */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-brand-border shadow-xl shadow-brand-primary/5 group lg:mt-auto">
              <ImageSlider
                images={sliderImages}
                fallbackImages={BACKUP_WHY_US_SLIDES}
                autoplayDelay={autoplayDelay}
              />
              <div
                className="absolute inset-0 border border-brand-surface/20 rounded-lg pointer-events-none z-10 mix-blend-overlay"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Right: Simple Check List */}
          <div className="grid grid-cols-1 gap-4">
            {data.steps.map((step) => (
              <CheckListItem 
                key={step.title}
                title={step.title}
                description={step.description}
                className="rounded-lg border border-brand-border bg-surface-neutral p-5 shadow-sm shadow-brand-primary/5"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
