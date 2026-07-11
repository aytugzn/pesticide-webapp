import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import type { CombinationDoc } from "@/types";

type CombinationHeroProps = {
  data: CombinationDoc;
  regionSlug: string;
  pestSlug: string;
  regionName?: string;
  pestName?: string;
};

export const CombinationHero = ({
  data,
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

      </div>
    </section>
  );
};
