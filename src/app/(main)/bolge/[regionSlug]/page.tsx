import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { ServiceHero } from "@/components/layouts/ServiceHero";
import { getGlobalData } from "@/features/settings/actions";
import { getAllActiveCombinations } from "@/features/combinations/actions";
import { CtaSection } from "@/components/layouts/CtaSection";
import { SeoContent } from "@/components/layouts/SeoContent";
import { SeoFaq } from "@/components/layouts/SeoFaq";
import { parseHtmlIntoSections } from "@/utils/parseHtmlIntoSections";
import { ServiceJsonLd } from "@/components/layouts/ServiceJsonLd";
import { BreadcrumbJsonLd } from "@/components/layouts/BreadcrumbJsonLd";
import { RelatedLinksSection } from "@/components/layouts/RelatedLinksSection";

type RegionPageProps = {
  params: Promise<{ regionSlug: string }>;
};

export const generateStaticParams = async () => {
  const { regions } = await getGlobalData();

  if (!regions || regions.length === 0) {
    throw new Error("No active regions found. At least one active region is required to build this route. Ensure Firestore quota is not exceeded and active regions exist.");
  }

  return regions.map((region) => ({ regionSlug: region.slug }));
};

export const generateMetadata = async ({
  params,
}: RegionPageProps): Promise<Metadata> => {
  const { regionSlug } = await params;
  const { regions } = await getGlobalData();
  const region = regions.find((item) => item.slug === regionSlug);

  return {
    title:
      region?.title ||
      (region
        ? `${region.name}${DICTIONARY.pages.regions.regionTitleSuffix} | ${DICTIONARY.global.brand}`
        : DICTIONARY.global.brand),
    description:
      region?.metaDesc ||
      region?.description ||
      `${region?.name || DICTIONARY.global.city}${DICTIONARY.pages.regions.regionDescSuffix}`,
    alternates: { canonical: `${ROUTES.regionBase}/${regionSlug}` },
  };
};

const RegionPage = async ({ params }: RegionPageProps) => {
  const { regionSlug } = await params;
  const { regions, pests } = await getGlobalData();
  const region = regions.find((item) => item.slug === regionSlug);

  if (!region) notFound();

  const activeCombinations = await getAllActiveCombinations();
  const sections = region.content ? parseHtmlIntoSections(region.content) : [];

  const relatedLinks = pests.map((pest) => {
    const hasCombination = activeCombinations.some(
      (combination) => combination.region === region.slug && combination.pest === pest.slug
    );
    return {
      href: hasCombination ? `/${region.slug}/${pest.slug}` : `${ROUTES.pestBase}/${pest.slug}`,
      title: `${region.name} ${pest.name}${DICTIONARY.pages.regions.pestTitleSuffix}`,
      description: pest.description || DICTIONARY.pages.services.defaultPestDesc,
      icon: "bug" as const,
    };
  });

  return (
    <div className="flex-1 flex flex-col w-full">
      <BreadcrumbJsonLd
        items={[
          { name: DICTIONARY.global.home, url: ROUTES.home },
          { name: DICTIONARY.pages.regions.heading, url: ROUTES.regions },
          { name: region.name, url: `${ROUTES.regionBase}/${region.slug}` },
        ]}
      />
      <ServiceJsonLd
        name={
          region.title ||
          `${region.name}${DICTIONARY.pages.regions.regionTitleSuffix}`
        }
        description={
          region.metaDesc ||
          region.description ||
          `${region.name}${DICTIONARY.pages.regions.regionDescSuffix}`
        }
        url={`${ROUTES.regionBase}/${region.slug}`}
        areaServed={region.name}
        faq={region.faq || []}
      />
      <ServiceHero
        h1={
          region.h1 ||
          `${region.name}${DICTIONARY.pages.regions.regionTitleSuffix}`
        }
        sliderImages={[]}
        type="region"
        regionSlug={region.slug}
        regionName={region.name}
      />
      {region.content && <SeoContent sections={sections} />}
      <RelatedLinksSection
        title={DICTIONARY.pages.services.heading}
        items={relatedLinks}
      />
      {region.faq && region.faq.length > 0 && (
        <SeoFaq faq={region.faq} />
      )}
      <CtaSection />
    </div>
  );
};

export default RegionPage;
