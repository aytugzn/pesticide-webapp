import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { SERVICES_SECTION_MAX_ITEMS } from "@/constants/ui";
import type { AppImage, PestDoc, SiteImageSlideDoc } from "@/types";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { ImageSlider, type SliderImage } from "@/components/ui/ImageSlider";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { resolveAppImage } from "@/utils/cloudinary";

type ServicesSectionProps = {
  pests: PestDoc[];
  slides?: SiteImageSlideDoc[];
  legacyImage?: AppImage;
  autoplayDelay?: number;
}

export const ServicesSection = ({
  pests,
  slides,
  legacyImage,
  autoplayDelay,
}: ServicesSectionProps) => {
  const displayPests = pests.slice(0, SERVICES_SECTION_MAX_ITEMS);
  const hasMore = pests.length > SERVICES_SECTION_MAX_ITEMS;

  let sliderImages: SliderImage[] = [];

  if (slides && slides.length > 0) {
    sliderImages = slides
      .map((slide) => {
        const resolved = resolveAppImage({
          image: slide.image,
          imageUrl: slide.imageUrl,
          fallbackAlt:
            slide.altText ||
            DICTIONARY.admin.settings.siteImages.servicesAltDefault,
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
      fallbackAlt: DICTIONARY.admin.settings.siteImages.servicesAltDefault,
      preset: "section",
    });
    if (resolvedImage) {
      sliderImages = [
        {
          id: "services-legacy",
          url: resolvedImage.url,
          altText: resolvedImage.alt,
        },
      ];
    }
  }

  if (sliderImages.length === 0) {
    sliderImages = [
      {
        id: "backup-services",
        url: "/backup/services.webp",
        altText: DICTIONARY.admin.settings.siteImages.servicesAltDefault,
      },
    ];
  }
  return (
    <section className="relative py-20 md:py-28" id="services" aria-labelledby="services-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Slider (Takes 5 columns) */}
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl shadow-2xl group md:aspect-landscape lg:sticky lg:top-32 lg:col-span-5 lg:aspect-portrait">
             {sliderImages.length > 0 ? (
               <>
                 <ImageSlider
                   images={sliderImages}
                   autoplayDelay={autoplayDelay}
                 />
                 {/* Elegant inner shadow for premium feel */}
                 <div className="absolute inset-0 border border-brand-surface/20 rounded-3xl pointer-events-none z-10 mix-blend-overlay" aria-hidden="true" />
               </>
             ) : (
               <ImagePlaceholder />
             )}
          </div>

          {/* Right Column: Content (Takes 7 columns) */}
          <div className="flex flex-col w-full lg:col-span-7">
            
            <SectionHeader 
              id="services-heading"
              eyebrow={DICTIONARY.home.services.title}
              titlePrefix={DICTIONARY.home.services.titlePrefix}
              titleHighlight={DICTIONARY.home.services.titleHighlight}
              description={DICTIONARY.home.services.description}
            />

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {displayPests.map((pest) => (
                <li key={pest.slug}>
                  <ServiceCard
                    href={`${ROUTES.pestBase}/${pest.slug}`}
                    title={`${pest.name} ${DICTIONARY.home.services.pestTitleSuffix}`}
                    className="h-full"
                  />
                </li>
              ))}

              {/* View All Button: Derived from the same component */}
              {hasMore && (
                <li>
                  <ServiceCard
                    variant="viewAll"
                    href={ROUTES.services}
                    title={DICTIONARY.home.services.viewAllServices}
                    className="h-full"
                  />
                </li>
              )}
            </ul>

          </div>
        </div>
      </div>
    </section>
  );
};
