import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { ImageSlider, type SliderImage } from "@/components/ui/ImageSlider";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import type { CombinationDoc } from "@/types";

type CombinationHeroProps = {
  data: CombinationDoc;
  sliderImages: SliderImage[];
  regionSlug: string;
  pestSlug: string;
  regionName?: string;
  pestName?: string;
};

export const CombinationHero = ({
  data,
  sliderImages,
  regionSlug,
  pestSlug,
  regionName,
  pestName,
}: CombinationHeroProps) => {
  const displayRegion = regionName || regionSlug.replace(/-/g, " ");
  const displayPest = pestName || pestSlug.replace(/-/g, " ");
  return (
    <section className="bg-surface-neutral">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Breadcrumb
          className="mb-6"
          items={[
            { name: DICTIONARY.global.home, url: ROUTES.home },
            { name: DICTIONARY.pages.regions.heading, url: ROUTES.regions },
            {
              name: displayRegion,
              url: `${ROUTES.regionBase}/${regionSlug}`,
            },
            { name: displayPest },
          ]}
        />

        <h1 className="font-heading font-bold text-text-primary text-2xl sm:text-3xl lg:text-4xl leading-snug max-w-3xl text-balance">
          {data.h1 ||
            `${displayRegion} ${displayPest} ${DICTIONARY.pages.services.pestTitleSuffix}`}
        </h1>

        <div className="mt-10 rounded-2xl overflow-hidden shadow-xl max-w-3xl aspect-video relative group">
          <ImageSlider images={sliderImages} autoplayDelay={0} />
          <div
            className="absolute inset-0 border border-brand-surface/20 rounded-2xl pointer-events-none z-10 mix-blend-overlay"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
};
