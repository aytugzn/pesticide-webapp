import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { ImageSlider, type SliderImage } from "@/components/ui/ImageSlider";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
    <section className="bg-brand-surface border-b border-brand-border">
      <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20">
        <nav aria-label={DICTIONARY.global.breadcrumb} className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-text-muted">
            <li>
              <Link
                href={ROUTES.home}
                className="hover:text-brand-primary transition-colors"
              >
                {DICTIONARY.navbar.links.services}
              </Link>
            </li>
            <li aria-hidden="true" className="text-text-muted/60">
              <ChevronRight className="w-4 h-4" />
            </li>
            <li>
              <Link
                href={`${ROUTES.regionBase}/${regionSlug}`}
                className="hover:text-brand-primary transition-colors capitalize"
              >
                {displayRegion}
              </Link>
            </li>
            <li aria-hidden="true" className="text-text-muted/60">
              <ChevronRight className="w-4 h-4" />
            </li>
            <li className="text-text-primary font-medium capitalize" aria-current="page">
              {displayPest}
            </li>
          </ol>
        </nav>

        <h1 className="font-heading font-bold text-text-primary text-3xl sm:text-4xl lg:text-5xl leading-tight">
          {data.h1}
        </h1>

        {/* Optional Image Slider (max 1 image) derived from Pest or Region */}
        {sliderImages.length > 0 && (
          <div className="mt-10 rounded-2xl overflow-hidden shadow-xl max-w-3xl aspect-video relative group">
            <ImageSlider images={sliderImages} autoplayDelay={0} />
            <div
              className="absolute inset-0 border border-brand-surface/20 rounded-2xl pointer-events-none z-10 mix-blend-overlay"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    </section>
  );
};
