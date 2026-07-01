import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bug } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layouts/PublicPageHeader";
import { getGlobalData } from "@/features/settings/actions";

type RegionPageProps = {
  params: Promise<{ regionSlug: string }>;
};

export const generateStaticParams = async () => {
  const { regions } = await getGlobalData();
  return regions.map((region) => ({ regionSlug: region.slug }));
};

export const generateMetadata = async ({ params }: RegionPageProps): Promise<Metadata> => {
  const { regionSlug } = await params;
  const { regions } = await getGlobalData();
  const region = regions.find((item) => item.slug === regionSlug);

  return {
    title: region ? `${region.name}${DICTIONARY.meta.regions.regionTitleSuffix} | ${DICTIONARY.global.brand}` : DICTIONARY.global.brand,
    description: region?.description || `${region?.name || DICTIONARY.global.city}${DICTIONARY.meta.regions.regionDescSuffix}`,
  };
};

const RegionPage = async ({ params }: RegionPageProps) => {
  const { regionSlug } = await params;
  const { regions, pests } = await getGlobalData();
  const region = regions.find((item) => item.slug === regionSlug);

  if (!region) notFound();

  return (
    <>
      <PublicPageHeader
        eyebrow={DICTIONARY.footer.sections.regions}
        title={`${region.name}${DICTIONARY.meta.regions.regionTitleSuffix}`}
        description={region.description || `${region.name}${DICTIONARY.meta.regions.regionDescSuffix}`}
      />
      <section className="bg-surface-neutral">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pests.map((pest) => (
            <Link
              key={pest.slug}
              href={`/${region.slug}/${pest.slug}`}
              className="group bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-primary/50 hover:shadow-lg transition-all"
            >
              <Bug className="w-7 h-7 text-brand-primary mb-5" aria-hidden="true" />
              <h2 className="font-heading font-bold text-text-primary text-xl group-hover:text-brand-primary transition-colors">
                {region.name} {pest.name}{DICTIONARY.meta.regions.pestTitleSuffix}
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mt-3">
                {pest.description || DICTIONARY.home.services.defaultPestDesc}
              </p>
            </Link>
          ))}
          <Link
            href={ROUTES.contact}
            className="bg-brand-primary text-brand-surface rounded-lg p-6 hover:bg-brand-primary-hover transition-colors"
          >
            <h2 className="font-heading font-bold text-xl">{DICTIONARY.meta.regions.ctaTitle}</h2>
            <p className="text-brand-surface/80 text-sm mt-3">
              {DICTIONARY.meta.regions.ctaDesc}
            </p>
          </Link>
        </div>
      </section>
    </>
  );
};

export default RegionPage;
