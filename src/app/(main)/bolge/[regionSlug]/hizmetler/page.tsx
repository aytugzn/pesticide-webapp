import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/exceptions";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import { RelatedLinksSection } from "@/components/layout/RelatedLinksSection";
import { CtaSection } from "@/components/layout/CtaSection";
import { ServiceJsonLd } from "@/components/layout/ServiceJsonLd";
import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { getGlobalData } from "@/features/settings/data";
import { getAllActiveCombinations } from "@/features/combinations/data";

type RegionServicesHubPageProps = {
  params: Promise<{ regionSlug: string }>;
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
 * Generates static region service hub paths only for regions with active combinations.
 */
export const generateStaticParams = async () => {
  const activeCombinations = await getAllActiveCombinations();

  if (!activeCombinations || activeCombinations.length === 0) {
    throw new AppError(
      "No active combinations found. At least one active combination is required to build region service hubs.",
      "BUILD_ERROR",
    );
  }

  const regionSlugs = Array.from(
    new Set(activeCombinations.map((combination) => combination.region)),
  );

  return regionSlugs.map((regionSlug) => ({ regionSlug }));
};

/**
 * Generates SEO metadata for region-specific service hub pages.
 */
export const generateMetadata = async ({
  params,
}: RegionServicesHubPageProps): Promise<Metadata> => {
  const { regionSlug } = await params;
  const [{ regions }, activeCombinations] = await Promise.all([
    getGlobalData(),
    getAllActiveCombinations(),
  ]);
  const region = regions.find((item) => item.slug === regionSlug);
  const hasCombinations = activeCombinations.some(
    (combination) => combination.region === regionSlug,
  );

  if (!region || !hasCombinations) {
    return {
      title: DICTIONARY.global.brand,
      robots: { index: false },
    };
  }

  const title = `${getRegionServicesHubTitle(region.name)} | ${DICTIONARY.global.brand}`;
  const description = getRegionServicesHubMetaDescription(region.name);
  const canonicalUrl = `${ROUTES.regionBase}/${region.slug}${ROUTES.services}`;

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

const RegionServicesHubPage = async ({
  params,
}: RegionServicesHubPageProps) => {
  const { regionSlug } = await params;
  const [{ regions, pests }, activeCombinations] = await Promise.all([
    getGlobalData(),
    getAllActiveCombinations(),
  ]);
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
          { name: title, url: canonicalUrl },
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

export default RegionServicesHubPage;
