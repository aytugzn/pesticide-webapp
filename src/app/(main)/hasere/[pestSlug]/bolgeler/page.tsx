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
import { resolveAppImage } from "@/utils/cloudinary";

type PestRegionsHubPageProps = {
  params: Promise<{ pestSlug: string }>;
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
 * Generates static pest region hub paths only for pests with active combinations.
 */
export const generateStaticParams = async () => {
  const activeCombinations = await getAllActiveCombinations();

  if (!activeCombinations || activeCombinations.length === 0) {
    throw new AppError(
      "No active combinations found. At least one active combination is required to build pest region hubs.",
      "BUILD_ERROR",
    );
  }

  const pestSlugs = Array.from(
    new Set(activeCombinations.map((combination) => combination.pest)),
  );

  return pestSlugs.map((pestSlug) => ({ pestSlug }));
};

/**
 * Generates SEO metadata for pest-specific region hub pages.
 */
export const generateMetadata = async ({
  params,
}: PestRegionsHubPageProps): Promise<Metadata> => {
  const { pestSlug } = await params;
  const [{ pests }, activeCombinations] = await Promise.all([
    getGlobalData(),
    getAllActiveCombinations(),
  ]);
  const pest = pests.find((item) => item.slug === pestSlug);
  const hasCombinations = activeCombinations.some(
    (combination) => combination.pest === pestSlug,
  );

  if (!pest || !hasCombinations) {
    return {
      title: DICTIONARY.global.brand,
      robots: { index: false },
    };
  }

  const serviceTitle = getServiceTitle(pest.name);
  const title = `${getPestRegionsHubTitle(serviceTitle)} | ${DICTIONARY.global.brand}`;
  const description = getPestRegionsHubMetaDescription(serviceTitle);
  const canonicalUrl = `${ROUTES.pestBase}/${pest.slug}${ROUTES.regions}`;
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

const PestRegionsHubPage = async ({ params }: PestRegionsHubPageProps) => {
  const { pestSlug } = await params;
  const [{ pests, regions }, activeCombinations] = await Promise.all([
    getGlobalData(),
    getAllActiveCombinations(),
  ]);
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

export default PestRegionsHubPage;
