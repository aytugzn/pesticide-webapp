import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import { getGlobalData } from "@/features/settings/data";
import { CtaSection } from "@/components/layout/CtaSection";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.regions.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.meta.regions.description,
  alternates: { canonical: ROUTES.regions },
};

const getRegionDescription = (name: string, cardDescription?: string) => {
  if (cardDescription) return cardDescription;

  return DICTIONARY.pages.regions.cardDescriptionTemplate.replace(
    "{region}",
    name,
  );
};

const RegionsPage = async () => {
  const { regions } = await getGlobalData();

  return (
    <>
      <PublicPageHeader
        eyebrow={DICTIONARY.pages.regions.eyebrow}
        title={DICTIONARY.pages.regions.heading}
        description={DICTIONARY.pages.regions.headerDesc}
      />
      <section className="bg-surface-neutral">
        <div className="max-w-7xl mx-auto px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((region) => (
              <Link
                key={region.slug}
                href={`${ROUTES.regionBase}/${region.slug}`}
                className="group flex min-h-64 flex-col bg-brand-surface border border-brand-border rounded-lg p-6 transition-all hover:border-brand-primary/50 hover:shadow-lg"
              >
                <MapPin className="w-7 h-7 text-brand-primary mb-5 shrink-0" aria-hidden="true" />
                <h2 className="font-heading font-bold text-text-primary text-xl leading-snug group-hover:text-brand-primary transition-colors">
                  {region.name}
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed mt-4">
                  {getRegionDescription(region.name, region.cardDescription)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
};

export default RegionsPage;
