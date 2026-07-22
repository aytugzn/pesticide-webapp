import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllActiveCombinationsResult,
  getCombination,
  getCombinationMetadataResult,
} from "@/features/combinations/data";
import { parseHtmlIntoSections } from "@/utils/parseHtmlIntoSections";
import { getGlobalDataResult } from "@/features/settings/data";
import { SeoContent } from "@/components/layout/SeoContent";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { ServiceJsonLd } from "@/components/layout/ServiceJsonLd";
import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { CombinationHero } from "@/features/combinations/components/public/CombinationHero";
import { SeoFaq } from "@/components/layout/SeoFaq";
import { CtaSection } from "@/components/layout/CtaSection";
import { RelatedLinksSection } from "@/components/layout/RelatedLinksSection";
import { resolveAppImage } from "@/utils/cloudinary";
import { Bug, MapPin } from "lucide-react";
import { resolvePublishedSnapshot } from "@/lib/resolvePublishedSnapshot";
import { getVisibleCombinationsById } from "@/lib/publicSnapshot";
import { AppError } from "@/lib/exceptions";

type CombinationPageProps = {
  params: Promise<{ regionSlug: string; pestSlug: string }>;
};

/**
 * Generates static params for all visible, active, non-archived combinations
 * whose parent region and pest are also active.
 */
export const generateStaticParams = async (): Promise<
  { regionSlug: string; pestSlug: string }[]
> => {
  const snapshot = await resolvePublishedSnapshot();
  const visible = getVisibleCombinationsById(snapshot);
  const params = Object.values(visible)
    .map((combination) => ({
      regionSlug: combination.region,
      pestSlug: combination.pest,
    }))
    .sort((a, b) =>
      `${a.regionSlug}_${a.pestSlug}`.localeCompare(
        `${b.regionSlug}_${b.pestSlug}`,
      ),
    );

  if (params.length === 0) {
    throw new AppError(
      "No published combination params are available for static generation",
      "PUBLISHED_STATIC_PARAMS_EMPTY",
    );
  }

  return params;
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
 * Generates SEO metadata for each combination page.
 * Pulls title, description, and OG data from the published provider chain.
 */
export const generateMetadata = async ({
  params,
}: CombinationPageProps): Promise<Metadata> => {
  const { regionSlug, pestSlug } = await params;
  const canonicalUrl = `/${regionSlug}/${pestSlug}`;
  const result = await getCombinationMetadataResult(regionSlug, pestSlug);

  // Provider errors now propagate as AppError and halt static generation

  if (result.status === "confirmed-missing") {
    notFound();
  }

  const data = result.data;
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
const CombinationPageContent = async ({ params }: CombinationPageProps) => {
  const { regionSlug, pestSlug } = await params;
  const [combinationResult, globalDataResult, combinationsResult] =
    await Promise.all([
      getCombination(regionSlug, pestSlug),
      getGlobalDataResult(),
      getAllActiveCombinationsResult(),
    ]);

  if (combinationResult.status === "confirmed-missing") notFound();

  const data = combinationResult.data;
  const globalData = globalDataResult.data;
  const activeCombinations = combinationsResult.data;

  // Use the pest's image as priority
  const region = globalData.regions?.find((r) => r.slug === regionSlug);
  const pest = globalData.pests?.find((p) => p.slug === pestSlug);

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

  const resolvedPestImage = pest
    ? resolveAppImage({
        image: pest.image,
        imageUrl: pest.imageUrl,
        fallbackAlt: data.h1 || DICTIONARY.meta.default.alt,
        preset: "section",
      })
    : null;

  const resolvedRegionImage = region
    ? resolveAppImage({
        image: region.image,
        imageUrl: region.imageUrl,
        fallbackAlt: regionName,
        preset: "section",
      })
    : null;

  const sections = data.content ? parseHtmlIntoSections(data.content) : [];
  const sectionVisuals: Record<
    number,
    { id: string; url: string; altText: string }
  > = {};
  const sectionFallbackIcons: Record<number, typeof Bug> = {};

  if (sections.length > 0) {
    sectionFallbackIcons[0] = Bug;
    if (resolvedPestImage) {
      sectionVisuals[0] = {
        id: "combo-pest",
        url: resolvedPestImage.url,
        altText: resolvedPestImage.alt,
      };
    }
  }

  if (sections.length > 1) {
    sectionFallbackIcons[1] = MapPin;
    if (resolvedRegionImage) {
      sectionVisuals[1] = {
        id: "combo-region",
        url: resolvedRegionImage.url,
        altText: resolvedRegionImage.alt,
      };
    }
  }

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
        regionSlug={regionSlug}
        pestSlug={pestSlug}
        regionName={regionName}
        pestName={pestName}
      />
      <SeoContent
        sections={sections}
        sectionVisuals={sectionVisuals}
        sectionFallbackIcons={sectionFallbackIcons}
      />
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

export default CombinationPageContent;
