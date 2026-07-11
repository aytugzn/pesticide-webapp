import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { ImageSlider, type SliderImage } from "@/components/ui/ImageSlider";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type ServiceHeroProps = {
  h1: string;
  sliderImages: SliderImage[];
  type: "region" | "pest" | "combination";
  regionSlug?: string;
  regionName?: string;
  pestSlug?: string;
  pestName?: string;
};

export const ServiceHero = ({
  h1,
  sliderImages,
  type,
  regionSlug,
  regionName,
  pestSlug,
  pestName,
}: ServiceHeroProps) => {
  const displayRegion =
    regionName || (regionSlug ? regionSlug.replace(/-/g, " ") : "");
  const displayPest = pestName || (pestSlug ? pestSlug.replace(/-/g, " ") : "");

  return (
    <section className="bg-surface-neutral">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <nav aria-label={DICTIONARY.global.breadcrumb} className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-text-muted">
            <li>
              <Link
                href={ROUTES.home}
                className="hover:text-brand-primary transition-colors"
              >
                {DICTIONARY.global.home}
              </Link>
            </li>

            {(type === "region" || type === "combination") && regionSlug && (
              <>
                <li aria-hidden="true" className="text-text-muted/60">
                  <ChevronRight className="w-4 h-4" />
                </li>
                {type === "region" ? (
                  <li
                    className="text-text-primary font-medium capitalize"
                    aria-current="page"
                  >
                    {displayRegion}
                  </li>
                ) : (
                  <li>
                    <Link
                      href={`${ROUTES.regionBase}/${regionSlug}`}
                      className="hover:text-brand-primary transition-colors capitalize"
                    >
                      {displayRegion}
                    </Link>
                  </li>
                )}
              </>
            )}

            {(type === "pest" || type === "combination") && pestSlug && (
              <>
                <li aria-hidden="true" className="text-text-muted/60">
                  <ChevronRight className="w-4 h-4" />
                </li>
                {type === "pest" ? (
                  <li
                    className="text-text-primary font-medium capitalize"
                    aria-current="page"
                  >
                    {displayPest}
                  </li>
                ) : (
                  <li
                    className="text-text-primary font-medium capitalize"
                    aria-current="page"
                  >
                    {displayPest}
                  </li>
                )}
              </>
            )}
          </ol>
        </nav>

        <h1 className="font-heading font-bold text-text-primary text-2xl sm:text-3xl lg:text-4xl leading-snug max-w-3xl text-balance">
          {h1}
        </h1>

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
