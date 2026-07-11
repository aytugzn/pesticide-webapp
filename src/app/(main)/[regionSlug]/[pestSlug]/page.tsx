import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/exceptions";
import {
  getCombination,
  getAllActiveCombinations,
} from "@/features/combinations/data";
import { parseHtmlIntoSections } from "@/utils/parseHtmlIntoSections";
import { getGlobalData } from "@/features/settings/data";
import { SeoContent } from "@/components/layout/SeoContent";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { ServiceJsonLd } from "@/components/layout/ServiceJsonLd";
import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { CombinationHero } from "@/features/combinations/components/public/CombinationHero";
import { SeoFaq } from "@/components/layout/SeoFaq";
import { CtaSection } from "@/components/layout/CtaSection";
import { RelatedLinksSection } from "@/components/layout/RelatedLinksSection";

type CombinationPageProps = {
  params: Promise<{ regionSlug: string; pestSlug: string }>;
};

const getRelatedServiceDescription = (
  service: string,
  cardDescription?: string,
) => {
  if (cardDescription) return cardDescription;

  const serviceTitle = `${service} ${DICTIONARY.pages.services.pestTitleSuffix}`;

  return DICTIONARY.pages.services.cardDescriptionTemplate.replace(
    "{service}",
    serviceTitle,
  );
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

const getServiceTitle = (pestName: string) =>
  `${pestName} ${DICTIONARY.pages.services.pestTitleSuffix}`;

const getRegionServicesListTitle = (regionName: string) =>
  DICTIONARY.pages.regions.serviceHubListTitleTemplate.replace(
    "{region}",
    regionName,
  );

const getRegionServicesViewAllTitle = (regionName: string) =>
  DICTIONARY.pages.regions.serviceHubViewAllTitleTemplate.replace(
    "{region}",
    regionName,
  );

const getPestRegionsListTitle = (serviceTitle: string) =>
  DICTIONARY.pages.services.regionHubListTitleTemplate.replace(
    "{service}",
    serviceTitle,
  );

const getPestRegionsViewAllTitle = (serviceTitle: string) =>
  DICTIONARY.pages.services.regionHubViewAllTitleTemplate.replace(
    "{service}",
    serviceTitle,
  );

/**
 * Generates static paths for all active combinations at build time.
 * Ensures each unique region-pest combination URL is pre-rendered.
 */
export const generateStaticParams = async () => {
  const combinations = await getAllActiveCombinations();

  if (!combinations || combinations.length === 0) {
    throw new AppError(
      "No active combinations found. At least one active combination is required to build this route. Ensure Firestore quota is not exceeded and active combinations exist.",
      "BUILD_ERROR",
    );
  }

  return combinations.map((c) => ({
    regionSlug: c.region,
    pestSlug: c.pest,
  }));
};

/**
 * Generates SEO metadata for each combination page.
 * Pulls title, description, and OG data directly from Firestore.
 */
export const generateMetadata = async ({
  params,
}: CombinationPageProps): Promise<Metadata> => {
  const { regionSlug, pestSlug } = await params;
  const data = await getCombination(regionSlug, pestSlug);

  if (!data) {
    return {
      title: DICTIONARY.meta.default.title,
      robots: { index: false },
    };
  }

  const canonicalUrl = `/${regionSlug}/${pestSlug}`;
  const ogImage = data.ogImage || DICTIONARY.meta.og.image.fallback;

  return {
    title: data.title || DICTIONARY.meta.default.title,
    description: data.metaDesc || DICTIONARY.meta.default.description,
    openGraph: {
      title: data.title || DICTIONARY.meta.default.title,
      description: data.metaDesc || DICTIONARY.meta.default.description,
      url: canonicalUrl,
      siteName: DICTIONARY.global.brand,
      images: [
        {
          url: ogImage,
          width: DICTIONARY.meta.og.image.width,
          height: DICTIONARY.meta.og.image.height,
          alt: data.h1 || DICTIONARY.meta.default.alt,
          type: DICTIONARY.meta.og.image.type,
        },
      ],
      locale: DICTIONARY.meta.default.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: data.title || DICTIONARY.meta.default.title,
      description: data.metaDesc || DICTIONARY.meta.default.description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
};

/**
 * Public combination page — the most SEO-valuable page type in this project.
 * Renders AI-generated content with proper semantic structure and JSON-LD.
 */
const CombinationPage = async ({ params }: CombinationPageProps) => {
  const { regionSlug, pestSlug } = await params;
  const [data, globalData, activeCombinations] = await Promise.all([
    getCombination(regionSlug, pestSlug),
    getGlobalData(),
    getAllActiveCombinations(),
  ]);

  if (!data) notFound();

  // Use the pest's image as priority
  const region = globalData.regions?.find((r) => r.slug === regionSlug);
  const pest = globalData.pests?.find((p) => p.slug === pestSlug);
  const imageUrl = pest?.imageUrl;

  const regionName = data.regionName || region?.name || "";
  const pestName = data.pestName || pest?.name || "";
  const serviceTitle = getServiceTitle(pestName);
  const pestDescriptions = new Map(
    globalData.pests.map((item) => [item.slug, item.cardDescription]),
  );
  const regionDescriptions = new Map(
    globalData.regions.map((item) => [item.slug, item.cardDescription]),
  );

  const regionCombinations = activeCombinations.filter(
    (combination) => combination.region === regionSlug,
  );
  const pestCombinations = activeCombinations.filter(
    (combination) => combination.pest === pestSlug,
  );

  const regionServiceLinks = regionCombinations
    .filter((combination) => combination.pest !== pestSlug)
    .map((combination) => ({
      href: `/${combination.region}/${combination.pest}`,
      title:
        combination.h1 ||
        `${combination.regionName} ${combination.pestName}${DICTIONARY.pages.regions.pestTitleSuffix}`,
      description:
        combination.metaDesc ||
        getRelatedServiceDescription(
          combination.pestName,
          pestDescriptions.get(combination.pest),
        ),
      icon: "bug" as const,
    }));

  const pestRegionLinks = pestCombinations
    .filter((combination) => combination.region !== regionSlug)
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

  const sliderImages = imageUrl
    ? [
        {
          id: "combo-hero",
          url: imageUrl,
          altText: data.h1 || DICTIONARY.meta.default.alt,
        },
      ]
    : [];

  const sections = data.content ? parseHtmlIntoSections(data.content) : [];

  return (
    <div className="flex-1 flex flex-col w-full">
      <BreadcrumbJsonLd
        items={[
          { name: DICTIONARY.global.home, url: ROUTES.home },
          { name: DICTIONARY.pages.regions.heading, url: ROUTES.regions },
          { name: regionName, url: `${ROUTES.regionBase}/${regionSlug}` },
          {
            name: pestName,
            url: `/${regionSlug}/${pestSlug}`,
          },
        ]}
      />
      <ServiceJsonLd
        name={
          data.h1 ||
          `${regionName} ${pestName} ${DICTIONARY.pages.services.pestTitleSuffix}`
        }
        description={data.metaDesc || DICTIONARY.meta.default.description}
        url={`/${regionSlug}/${pestSlug}`}
        areaServed={regionName}
        faq={data.faq || []}
      />
      <CombinationHero
        data={data}
        sliderImages={sliderImages}
        regionSlug={regionSlug}
        pestSlug={pestSlug}
        regionName={regionName}
        pestName={pestName}
      />
      <SeoContent sections={sections} />
      <RelatedLinksSection
        title={getRegionServicesListTitle(regionName)}
        items={regionServiceLinks}
        viewAllHref={
          regionCombinations.length > 0
            ? `${ROUTES.regionBase}/${regionSlug}${ROUTES.services}`
            : undefined
        }
        viewAllTitle={getRegionServicesViewAllTitle(regionName)}
        viewAllDescription={DICTIONARY.navbar.columns.viewAllPestsDesc}
        viewAllIcon="bug"
      />
      <RelatedLinksSection
        title={getPestRegionsListTitle(serviceTitle)}
        items={pestRegionLinks}
        viewAllHref={
          pestCombinations.length > 0
            ? `${ROUTES.pestBase}/${pestSlug}${ROUTES.regions}`
            : undefined
        }
        viewAllTitle={getPestRegionsViewAllTitle(serviceTitle)}
        viewAllDescription={DICTIONARY.navbar.columns.viewAllRegionsDesc}
        viewAllIcon="map-pin"
      />
      <SeoFaq faq={data.faq || []} />
      <CtaSection />
    </div>
  );
};

export default CombinationPage;
