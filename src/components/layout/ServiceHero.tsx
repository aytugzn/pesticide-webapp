import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { ImageSlider, type SliderImage } from "@/components/ui/ImageSlider";
import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/Breadcrumb";

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
  const breadcrumbItems: BreadcrumbItem[] = [
    { name: DICTIONARY.global.home, url: ROUTES.home },
  ];

  if ((type === "region" || type === "combination") && regionSlug) {
    breadcrumbItems.push(
      { name: DICTIONARY.pages.regions.heading, url: ROUTES.regions },
      {
        name: displayRegion,
        url:
          type === "combination"
            ? `${ROUTES.regionBase}/${regionSlug}`
            : undefined,
      },
    );
  }

  if (type === "pest" && pestSlug) {
    breadcrumbItems.push(
      { name: DICTIONARY.pages.services.heading, url: ROUTES.services },
      { name: displayPest },
    );
  } else if (type === "combination" && pestSlug) {
    breadcrumbItems.push({ name: displayPest });
  }

  return (
    <section className="bg-surface-neutral">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

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
