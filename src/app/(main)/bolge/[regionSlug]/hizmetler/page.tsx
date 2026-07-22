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
import { resolvePublishedSnapshot } from "@/lib/resolvePublishedSnapshot";
import { getVisibleCombinationsById } from "@/lib/publicSnapshot";
import { AppError } from "@/lib/exceptions";

type RegionServicesHubPageProps = {
  params: Promise<{ regionSlug: string }>;
};

/**
 * Generates static params for region slugs with at least one visible combination.
 */
export const generateStaticParams = async (): Promise<
  { regionSlug: string }[]
> => {
  const snapshot = await resolvePublishedSnapshot();
  const visible = getVisibleCombinationsById(snapshot);
  const regionSlugs = [
    ...new Set(Object.values(visible).map((c) => c.region)),
  ];
  const params = regionSlugs
    .sort()
    .map((slug) => ({ regionSlug: slug }));

  if (params.length === 0) {
    throw new AppError(
      "No published region params are available for static generation",
      "PUBLISHED_STATIC_PARAMS_EMPTY",
    );
  }

  return params;
};

const getRegionServicesHubTitle = (regionName: string) =>
  DICTIONARY.pages.regions.serviceHubTitleTemplate.replace(
    "{region}",
    regionName,
  );

const getRegionServicesHubDescription = (regionName: string) =>
  DICTIONARY.pages.regions.serviceHubDescriptionTemplate.replace(
    "{region}",
    regionName,
  );

const getRegionServicesHubMetaDescription = (regionName: string) =>
  DICTIONARY.pages.regions.serviceHubMetaDescriptionTemplate.replace(
    "{region}",
    regionName,
  );

const getRegionServicesListTitle = (regionName: string) =>
  DICTIONARY.pages.regions.serviceHubListTitleTemplate.replace(
    "{region}",
    regionName,
  );

const getServiceDescription = (service: string, cardDescription?: string) => {
  if (cardDescription) return cardDescription;

  const serviceTitle = `${service} ${DICTIONARY.pages.services.pestTitleSuffix}`;

  return DICTIONARY.pages.services.cardDescriptionTemplate.replace(
    "{service}",
    serviceTitle,
  );
};

const getCombinationServiceTitle = (
  regionName: string,
  pestName: string,
  combinationTitle?: string,
) =>
  combinationTitle ||
  `${regionName} ${pestName}${DICTIONARY.pages.regions.pestTitleSuffix}`;

/**
 * Generates SEO metadata for region-specific service hub pages.
 */
export const generateMetadata = async ({
  params,
}: RegionServicesHubPageProps): Promise<Metadata> => {
  const { regionSlug } = await params;
  const canonicalUrl = `${ROUTES.regionBase}/${regionSlug}${ROUTES.services}`;
  const [globalDataResult, combinationsResult] = await Promise.all([
    getGlobalDataMetadataResult(),
    getAllActiveCombinationsMetadataResult(),
  ]);

  const { regions } = globalDataResult.data;
  const activeCombinations = combinationsResult.data;
  const region = regions.find((item) => item.slug === regionSlug);
  const hasCombinations = activeCombinations.some(
    (combination) => combination.region === regionSlug,
  );

  if (!region || !hasCombinations) {
    notFound();
  }

  const title = `${getRegionServicesHubTitle(region.name)} | ${DICTIONARY.global.brand}`;
  const description = getRegionServicesHubMetaDescription(region.name);

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
          url: DICTIONARY.meta.og.image.fallback,
          width: DICTIONARY.meta.og.image.width,
          height: DICTIONARY.meta.og.image.height,
          alt: title,
          type: DICTIONARY.meta.og.image.type,
        },
      ],
      locale: DICTIONARY.meta.default.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DICTIONARY.meta.og.image.fallback],
    },
  };
};

const RegionServicesHubPageContent = async ({
  params,
}: RegionServicesHubPageProps) => {
  const { regionSlug } = await params;
  const [globalDataResult, combinationsResult] = await Promise.all([
    getGlobalDataResult(),
    getAllActiveCombinationsResult(),
  ]);

  const { regions, pests } = globalDataResult.data;
  const activeCombinations = combinationsResult.data;
  const region = regions.find((item) => item.slug === regionSlug);

  if (!region) notFound();

  const pestDescriptions = new Map(
    pests.map((pest) => [pest.slug, pest.cardDescription]),
  );
  const regionCombinations = activeCombinations.filter(
    (combination) => combination.region === region.slug,
  );

  if (regionCombinations.length === 0) notFound();

  const title = getRegionServicesHubTitle(region.name);
  const description = getRegionServicesHubDescription(region.name);
  const canonicalUrl = `${ROUTES.regionBase}/${region.slug}${ROUTES.services}`;
  const relatedLinks = regionCombinations
    .map((combination) => ({
      href: `/${combination.region}/${combination.pest}`,
      title: getCombinationServiceTitle(
        combination.regionName,
        combination.pestName,
        combination.h1,
      ),
      description:
        combination.metaDesc ||
        getServiceDescription(
          combination.pestName,
          pestDescriptions.get(combination.pest),
        ),
      icon: "bug" as const,
    }));

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: DICTIONARY.global.home, url: ROUTES.home },
          { name: DICTIONARY.pages.regions.heading, url: ROUTES.regions },
          { name: region.name, url: `${ROUTES.regionBase}/${region.slug}` },
          { name: DICTIONARY.pages.services.heading, url: canonicalUrl },
        ]}
      />
      <ServiceJsonLd
        name={title}
        description={description}
        url={canonicalUrl}
        areaServed={region.name}
      />
      <PublicPageHeader
        eyebrow={DICTIONARY.pages.regions.serviceHubEyebrow}
        title={title}
        description={description}
        breadcrumbs={[
          { name: DICTIONARY.global.home, url: ROUTES.home },
          { name: DICTIONARY.pages.regions.heading, url: ROUTES.regions },
          { name: region.name, url: `${ROUTES.regionBase}/${region.slug}` },
          { name: DICTIONARY.pages.services.heading },
        ]}
      />
      <RelatedLinksSection
        title={getRegionServicesListTitle(region.name)}
        items={relatedLinks}
        showAllItems
      />
      <CtaSection />
    </>
  );
};

export default RegionServicesHubPageContent;
