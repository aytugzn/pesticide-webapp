import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import { RelatedLinksSection } from "@/components/layout/RelatedLinksSection";
import { CtaSection } from "@/components/layout/CtaSection";
import { ServiceJsonLd } from "@/components/layout/ServiceJsonLd";
import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import {
  getGlobalDataMetadataResult,
  getGlobalDataResult,
} from "@/features/settings/data";
import {
  getAllActiveCombinationsMetadataResult,
  getAllActiveCombinationsResult,
} from "@/features/combinations/data";
import { resolveAppImage } from "@/utils/cloudinary";
import { resolvePublishedSnapshot } from "@/lib/resolvePublishedSnapshot";
import { getVisibleCombinationsById } from "@/lib/publicSnapshot";
import { AppError } from "@/lib/exceptions";

type PestRegionsHubPageProps = {
  params: Promise<{ pestSlug: string }>;
};

/**
 * Generates static params for pest slugs with at least one visible combination.
 */
export const generateStaticParams = async (): Promise<
  { pestSlug: string }[]
> => {
  const snapshot = await resolvePublishedSnapshot();
  const visible = getVisibleCombinationsById(snapshot);
  const pestSlugs = [
    ...new Set(Object.values(visible).map((c) => c.pest)),
  ];
  const params = pestSlugs
    .sort()
    .map((slug) => ({ pestSlug: slug }));

  if (params.length === 0) {
    throw new AppError(
      "No published pest params are available for static generation",
      "PUBLISHED_STATIC_PARAMS_EMPTY",
    );
  }

  return params;
};

const getServiceTitle = (pestName: string) =>
  `${pestName} ${DICTIONARY.pages.services.pestTitleSuffix}`;

const getPestRegionsHubTitle = (serviceTitle: string) =>
  DICTIONARY.pages.services.regionHubTitleTemplate.replace(
    "{service}",
    serviceTitle,
  );

const getPestRegionsHubDescription = (serviceTitle: string) =>
  DICTIONARY.pages.services.regionHubDescriptionTemplate.replace(
    "{service}",
    serviceTitle,
  );

const getPestRegionsHubMetaDescription = (serviceTitle: string) =>
  DICTIONARY.pages.services.regionHubMetaDescriptionTemplate.replace(
    "{service}",
    serviceTitle,
  );

const getPestRegionsListTitle = (serviceTitle: string) =>
  DICTIONARY.pages.services.regionHubListTitleTemplate.replace(
    "{service}",
    serviceTitle,
  );

const getRegionDescription = (region: string, cardDescription?: string) => {
  if (cardDescription) return cardDescription;

  return DICTIONARY.pages.regions.cardDescriptionTemplate.replace(
    "{region}",
    region,
  );
};

const getCombinationRegionTitle = (
  regionName: string,
  serviceTitle: string,
  combinationTitle?: string,
) => combinationTitle || `${regionName} ${serviceTitle}`;

/**
 * Generates SEO metadata for pest-specific region hub pages.
 */
export const generateMetadata = async ({
  params,
}: PestRegionsHubPageProps): Promise<Metadata> => {
  const { pestSlug } = await params;
  const canonicalUrl = `${ROUTES.pestBase}/${pestSlug}${ROUTES.regions}`;
  const [globalDataResult, combinationsResult] = await Promise.all([
    getGlobalDataMetadataResult(),
    getAllActiveCombinationsMetadataResult(),
  ]);

  const { pests } = globalDataResult.data;
  const activeCombinations = combinationsResult.data;
  const pest = pests.find((item) => item.slug === pestSlug);
  const hasCombinations = activeCombinations.some(
    (combination) => combination.pest === pestSlug,
  );

  if (!pest || !hasCombinations) {
    notFound();
  }

  const serviceTitle = getServiceTitle(pest.name);
  const title = `${getPestRegionsHubTitle(serviceTitle)} | ${DICTIONARY.global.brand}`;
  const description = getPestRegionsHubMetaDescription(serviceTitle);
  const resolvedOgImage = resolveAppImage({
    image: pest.image,
    imageUrl: pest.imageUrl,
    fallbackAlt: pest.h1 || title,
    preset: "og",
  });
  const ogImage = resolvedOgImage?.url || DICTIONARY.meta.og.image.fallback;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: DICTIONARY.global.brand,
      images: [
        {
          url: ogImage,
          alt: resolvedOgImage?.alt || pest.h1 || title,
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

const PestRegionsHubPageContent = async ({
  params,
}: PestRegionsHubPageProps) => {
  const { pestSlug } = await params;
  const [globalDataResult, combinationsResult] = await Promise.all([
    getGlobalDataResult(),
    getAllActiveCombinationsResult(),
  ]);

  const { pests, regions } = globalDataResult.data;
  const activeCombinations = combinationsResult.data;
  const pest = pests.find((item) => item.slug === pestSlug);

  if (!pest) notFound();

  const regionDescriptions = new Map(
    regions.map((region) => [region.slug, region.cardDescription]),
  );
  const pestCombinations = activeCombinations.filter(
    (combination) => combination.pest === pest.slug,
  );

  if (pestCombinations.length === 0) notFound();

  const serviceTitle = getServiceTitle(pest.name);
  const title = getPestRegionsHubTitle(serviceTitle);
  const description = getPestRegionsHubDescription(serviceTitle);
  const canonicalUrl = `${ROUTES.pestBase}/${pest.slug}${ROUTES.regions}`;
  const relatedLinks = pestCombinations
    .map((combination) => ({
      href: `/${combination.region}/${combination.pest}`,
      title: getCombinationRegionTitle(
        combination.regionName,
        serviceTitle,
        combination.h1,
      ),
      description:
        combination.metaDesc ||
        getRegionDescription(
          combination.regionName,
          regionDescriptions.get(combination.region),
        ),
      icon: "map-pin" as const,
    }));

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: DICTIONARY.global.home, url: ROUTES.home },
          { name: DICTIONARY.pages.services.heading, url: ROUTES.services },
          { name: pest.name, url: `${ROUTES.pestBase}/${pest.slug}` },
          { name: DICTIONARY.pages.regions.heading, url: canonicalUrl },
        ]}
      />
      <ServiceJsonLd
        name={title}
        description={description}
        url={canonicalUrl}
        areaServed={DICTIONARY.global.city}
      />
      <PublicPageHeader
        eyebrow={DICTIONARY.pages.services.regionHubEyebrow}
        title={title}
        description={description}
        breadcrumbs={[
          { name: DICTIONARY.global.home, url: ROUTES.home },
          { name: DICTIONARY.pages.services.heading, url: ROUTES.services },
          { name: pest.name, url: `${ROUTES.pestBase}/${pest.slug}` },
          { name: DICTIONARY.pages.regions.heading },
        ]}
      />
      <RelatedLinksSection
        title={getPestRegionsListTitle(serviceTitle)}
        items={relatedLinks}
        showAllItems
      />
      <CtaSection />
    </>
  );
};

export default PestRegionsHubPageContent;
