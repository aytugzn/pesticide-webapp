import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { SERVICES_SECTION_MAX_ITEMS } from "@/constants/ui";
import type { PestDoc } from "@/types";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { ImageSlider } from "@/components/ui/ImageSlider";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import type { HeroSlideDoc } from "@/features/home/types";

interface ServicesSectionProps {
  pests: PestDoc[];
  autoplayDelay?: number;
}

export const ServicesSection = ({ pests, autoplayDelay }: ServicesSectionProps) => {
  const displayPests = pests.slice(0, SERVICES_SECTION_MAX_ITEMS);
  const hasMore = pests.length > SERVICES_SECTION_MAX_ITEMS;

  const slides: HeroSlideDoc[] = displayPests
    .filter(p => p.imageUrl)
    .map((p, index) => ({
      id: p.slug,
      imageUrl: p.imageUrl!,
      altText: p.name,
      order: index,
    }));

  return (
    <section className="py-24 md:py-32 relative" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Slider (Takes 5 columns) - Hidden on mobile/tablet */}
          <div className="hidden lg:block w-full lg:col-span-5 aspect-portrait rounded-3xl overflow-hidden shadow-2xl relative lg:sticky lg:top-32 group">
             {slides.length > 0 ? (
               <>
                 <ImageSlider 
                   images={slides.map(slide => ({
                     id: slide.id || slide.imageUrl,
                     url: slide.imageUrl,
                     altText: slide.altText
                   }))} 
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
            
            {/* Header: No calculator borders, just pure typography */}
            <div className="mb-12">
              <span className="text-sm font-black text-brand-primary tracking-widest uppercase mb-4 block">
                {DICTIONARY.home.services.title}
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-text-primary tracking-tight mb-6 leading-tight">
                {DICTIONARY.home.services.titlePrefix} <span className="text-brand-primary">{DICTIONARY.home.services.titleHighlight}</span>
              </h2>
              <p className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-xl">
                {DICTIONARY.home.services.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {displayPests.map((pest) => (
                <ServiceCard
                  key={pest.slug}
                  href={`${ROUTES.pestBase}/${pest.slug}`}
                  title={`${pest.name} ${DICTIONARY.home.services.pestTitleSuffix}`}
                />
              ))}

              {/* View All Button: Derived from the same component */}
              {hasMore && (
                <ServiceCard
                  variant="viewAll"
                  href={ROUTES.services}
                  title={DICTIONARY.home.services.viewAllServices}
                />
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
