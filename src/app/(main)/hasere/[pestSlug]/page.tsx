import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/exceptions";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { ServiceHero } from "@/components/layout/ServiceHero";
import { SeoContent } from "@/components/layout/SeoContent";
import { SeoFaq } from "@/components/layout/SeoFaq";
import { parseHtmlIntoSections } from "@/utils/parseHtmlIntoSections";
import { CtaSection } from "@/components/layout/CtaSection";
import { getGlobalData } from "@/features/settings/data";
import { getAllActiveCombinations } from "@/features/combinations/actions";
import { ServiceJsonLd } from "@/components/layout/ServiceJsonLd";
import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { RelatedLinksSection } from "@/components/layout/RelatedLinksSection";

type PestPageProps = {
  params: Promise<{ pestSlug: string }>;
};

const getRelatedRegionDescription = (
  region: string,
  cardDescription?: string,
) => {
  if (cardDescription) return cardDescription;

  return DICTIONARY.pages.regions.cardDescriptionTemplate.replace(
    "{region}",
    region,
  );
};

export const generateStaticParams = async () => {
  const { pests } = await getGlobalData();

  if (!pests || pests.length === 0) {
    throw new AppError("No active pests found. At least one active pest is required to build this route. Ensure Firestore quota is not exceeded and active pests exist.", "BUILD_ERROR");
  }

  return pests.map((pest) => ({ pestSlug: pest.slug }));
};

export const generateMetadata = async ({
  params,
}: PestPageProps): Promise<Metadata> => {
  const { pestSlug } = await params;
  const { pests } = await getGlobalData();
  const pest = pests.find((item) => item.slug === pestSlug);

  return {
    title:
      pest?.title ||
      (pest
        ? `${pest.name} ${DICTIONARY.pages.services.pestTitleSuffix} | ${DICTIONARY.global.brand}`
        : DICTIONARY.global.brand),
    description:
      pest?.metaDesc ||
      pest?.description ||
      DICTIONARY.pages.services.defaultPestDesc,
    alternates: { canonical: `${ROUTES.pestBase}/${pestSlug}` },
  };
};

const PestPage = async ({ params }: PestPageProps) => {
  const { pestSlug } = await params;
  const { pests, regions } = await getGlobalData();
  const pest = pests.find((item) => item.slug === pestSlug);

  if (!pest) notFound();

  const activeCombinations = await getAllActiveCombinations();
  const sections = pest.content ? parseHtmlIntoSections(pest.content) : [];

  const relatedLinks = regions.map((region) => {
    const hasCombination = activeCombinations.some(
      (combination) => combination.region === region.slug && combination.pest === pest.slug
    );
    return {
      href: hasCombination ? `/${region.slug}/${pest.slug}` : `${ROUTES.regionBase}/${region.slug}`,
      title: `${region.name} ${pest.name} ${DICTIONARY.pages.services.pestTitleSuffix}`,
      description: getRelatedRegionDescription(region.name, region.cardDescription),
      icon: "map-pin" as const,
    };
  });

  return (
    <div className="flex-1 flex flex-col w-full">
      <BreadcrumbJsonLd
        items={[
          { name: DICTIONARY.global.home, url: ROUTES.home },
          { name: DICTIONARY.pages.services.heading, url: ROUTES.services },
          { name: pest.name, url: `${ROUTES.pestBase}/${pest.slug}` },
        ]}
      />
      <ServiceJsonLd
        name={
          pest.title ||
          `${pest.name} ${DICTIONARY.pages.services.pestTitleSuffix}`
        }
        description={
          pest.metaDesc ||
          pest.description ||
          DICTIONARY.pages.services.defaultPestDesc
        }
        url={`${ROUTES.pestBase}/${pest.slug}`}
        areaServed={DICTIONARY.global.city}
        faq={pest.faq || []}
      />
      <ServiceHero
        h1={
          pest.h1 || `${pest.name} ${DICTIONARY.pages.services.pestTitleSuffix}`
        }
        sliderImages={
          pest.imageUrl
            ? [
                {
                  id: "pest-hero",
                  url: pest.imageUrl,
                  altText: pest.h1 || pest.name,
                },
              ]
            : []
        }
        type="pest"
        pestSlug={pest.slug}
        pestName={pest.name}
      />
      {pest.content && <SeoContent sections={sections} />}
      <RelatedLinksSection
        title={DICTIONARY.pages.regions.heading}
        items={relatedLinks}
        viewAllHref={ROUTES.regions}
        viewAllTitle={DICTIONARY.navbar.columns.viewAllRegions}
        viewAllDescription={DICTIONARY.navbar.columns.viewAllRegionsDesc}
        viewAllIcon="map-pin"
      />
      {pest.faq && pest.faq.length > 0 && <SeoFaq faq={pest.faq} />}
      <CtaSection />
    </div>
  );
};

export default PestPage;
