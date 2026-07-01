import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layouts/PublicPageHeader";
import { getGlobalData } from "@/features/settings/actions";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.regions.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.meta.regions.description,
  alternates: { canonical: ROUTES.regions },
};

const RegionsPage = async () => {
  const { regions } = await getGlobalData();

  return (
    <>
      <PublicPageHeader
        eyebrow={DICTIONARY.footer.sections.regions}
        title={DICTIONARY.meta.regions.title}
        description={DICTIONARY.meta.regions.description}
      />
      <section className="bg-surface-neutral">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regions.map((region) => (
            <Link
              key={region.slug}
              href={`${ROUTES.regionBase}/${region.slug}`}
              className="group bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-primary/50 hover:shadow-lg transition-all"
            >
              <MapPin className="w-7 h-7 text-brand-primary mb-5" aria-hidden="true" />
              <h2 className="font-heading font-bold text-text-primary text-xl group-hover:text-brand-primary transition-colors">
                {region.name}
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mt-3">
                {region.description || `${region.name}${DICTIONARY.meta.regions.regionDescSuffix}`}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
};

export default RegionsPage;
