import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { ServiceHero } from "@/components/layout/ServiceHero";
import { SeoContent } from "@/components/layout/SeoContent";
import { SeoFaq } from "@/components/layout/SeoFaq";
import { parseHtmlIntoSections } from "@/utils/parseHtmlIntoSections";
import { CtaSection } from "@/components/layout/CtaSection";
import {
  getGlobalDataMetadataResult,
  getGlobalDataResult,
} from "@/features/settings/data";
import { getAllActiveCombinationsResult } from "@/features/combinations/data";
import { ServiceJsonLd } from "@/components/layout/ServiceJsonLd";
import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { RelatedLinksSection } from "@/components/layout/RelatedLinksSection";
import { resolveAppImage } from "@/utils/cloudinary";
import { Bug } from "lucide-react";
import { resolvePublishedSnapshot } from "@/lib/resolvePublishedSnapshot";
import { getVisibleGlobalData } from "@/lib/publicSnapshot";
import { AppError } from "@/lib/exceptions";

type PestPageProps = {
  params: Promise<{ pestSlug: string }>;
};

/**
 * Generates static params for all published, active pest slugs.
 */
export const generateStaticParams = async (): Promise<
  { pestSlug: string }[]
> => {
  const snapshot = await resolvePublishedSnapshot();
  const { pests } = getVisibleGlobalData(snapshot);
  const params = pests
    .map((pest) => ({ pestSlug: pest.slug }))
    .sort((a, b) => a.pestSlug.localeCompare(b.pestSlug));

  if (params.length === 0) {
    throw new AppError(
      "No published pest params are available for static generation",
      "PUBLISHED_STATIC_PARAMS_EMPTY",
    );
  }

  return params;
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

export const generateMetadata = async ({
  params,
}: PestPageProps): Promise<Metadata> => {
  const { pestSlug } = await params;
  const canonicalUrl = `${ROUTES.pestBase}/${pestSlug}`;
  const globalDataResult = await getGlobalDataMetadataResult();
  const pest = globalDataResult.data.pests.find(
    (item) => item.slug === pestSlug,
  );
  if (!pest) notFound();

  const title =
    pest?.title ||
    (pest
      ? `${pest.name} ${DICTIONARY.pages.services.pestTitleSuffix} | ${DICTIONARY.global.brand}`
      : DICTIONARY.global.brand);
  const description =
    pest?.metaDesc ||
    pest?.description ||
    DICTIONARY.pages.services.defaultPestDesc;
  const resolvedOgImage = pest
    ? resolveAppImage({
        image: pest.image,
        imageUrl: pest.imageUrl,
        fallbackAlt: pest.h1 || title,
        preset: "og",
      })
    : null;
  const ogImage = resolvedOgImage?.url || DICTIONARY.meta.og.image.fallback;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: DICTIONARY.global.brand,
      images: [
        {
          url: ogImage,
          alt: resolvedOgImage?.alt || pest?.h1 || title,
        },
      ],
      locale: DICTIONARY.meta.default.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
};

const PestPageContent = async ({ params }: PestPageProps) => {
  const { pestSlug } = await params;
  const [globalDataResult, combinationsResult] = await Promise.all([
    getGlobalDataResult(),
    getAllActiveCombinationsResult(),
  ]);

  const { pests, regions } = globalDataResult.data;
  const pest = pests.find((item) => item.slug === pestSlug);

  if (!pest) notFound();

  const activeCombinations = combinationsResult.data;
  const sections = pest.content ? parseHtmlIntoSections(pest.content) : [];
  const regionDescriptions = new Map(
    regions.map((region) => [region.slug, region.cardDescription]),
  );
  const serviceTitle = `${pest.name} ${DICTIONARY.pages.services.pestTitleSuffix}`;
  const resolvedSectionImage = resolveAppImage({
    image: pest.image,
    imageUrl: pest.imageUrl,
    fallbackAlt: pest.h1 || pest.name,
    preset: "section",
  });
  const sectionVisuals =
    sections.length > 0 && resolvedSectionImage
      ? {
          0: {
            id: "pest-section",
            url: resolvedSectionImage.url,
            altText: resolvedSectionImage.alt,
          },
        }
      : undefined;
  const sectionFallbackIcons = sections.length > 0 ? { 0: Bug } : undefined;

  const relatedLinks = activeCombinations
    .filter((combination) => combination.pest === pest.slug)
    .map((combination) => ({
      href: `/${combination.region}/${combination.pest}`,
      title: combination.h1 || `${combination.regionName} ${serviceTitle}`,
      description:
        combination.metaDesc ||
        getRelatedRegionDescription(
          combination.regionName,
          regionDescriptions.get(combination.region),
        ),
      icon: "map-pin" as const,
    }));

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
        type="pest"
        pestSlug={pest.slug}
        pestName={pest.name}
      />
      {pest.content && (
        <SeoContent
          sections={sections}
          sectionVisuals={sectionVisuals}
          sectionFallbackIcons={sectionFallbackIcons}
        />
      )}
      <RelatedLinksSection
        title={DICTIONARY.pages.regions.heading}
        items={relatedLinks}
        viewAllHref={
          relatedLinks.length > 0
            ? `${ROUTES.pestBase}/${pest.slug}${ROUTES.regions}`
            : undefined
        }
        viewAllTitle={DICTIONARY.navbar.columns.viewAllRegions}
        viewAllDescription={DICTIONARY.navbar.columns.viewAllRegionsDesc}
        viewAllIcon="map-pin"
      />
      {pest.faq && pest.faq.length > 0 && <SeoFaq faq={pest.faq} />}
      <CtaSection />
    </div>
  );
};

export default PestPageContent;
