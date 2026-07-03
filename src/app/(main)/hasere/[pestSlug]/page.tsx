import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { ServiceHero } from "@/components/layouts/ServiceHero";
import { SeoContent } from "@/components/layouts/SeoContent";
import { SeoFaq } from "@/components/layouts/SeoFaq";
import { parseHtmlIntoSections } from "@/utils/parseHtmlIntoSections";
import { CtaSection } from "@/components/layouts/CtaSection";
import { getGlobalData } from "@/features/settings/actions";
import { getAllActiveCombinations } from "@/features/combinations/actions";
import { ServiceJsonLd } from "@/components/layouts/ServiceJsonLd";
import { BreadcrumbJsonLd } from "@/components/layouts/BreadcrumbJsonLd";
import { RelatedLinksSection } from "@/components/layouts/RelatedLinksSection";

type PestPageProps = {
  params: Promise<{ pestSlug: string }>;
};

export const generateStaticParams = async () => {
  const { pests } = await getGlobalData();
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
      description: region.description || `${region.name}${DICTIONARY.pages.regions.regionDescSuffix}`,
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
      />
      {pest.faq && pest.faq.length > 0 && <SeoFaq faq={pest.faq} />}
      <CtaSection />
    </div>
  );
};

export default PestPage;
