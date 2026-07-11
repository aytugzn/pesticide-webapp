import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/exceptions";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { ServiceHero } from "@/components/layout/ServiceHero";
import { getGlobalData } from "@/features/settings/data";
import { getAllActiveCombinations } from "@/features/combinations/data";
import { CtaSection } from "@/components/layout/CtaSection";
import { SeoContent } from "@/components/layout/SeoContent";
import { SeoFaq } from "@/components/layout/SeoFaq";
import { parseHtmlIntoSections } from "@/utils/parseHtmlIntoSections";
import { ServiceJsonLd } from "@/components/layout/ServiceJsonLd";
import { BreadcrumbJsonLd } from "@/components/layout/BreadcrumbJsonLd";
import { RelatedLinksSection } from "@/components/layout/RelatedLinksSection";
import { resolveAppImage } from "@/utils/cloudinary";
import { MapPin } from "lucide-react";

type RegionPageProps = {
  params: Promise<{ regionSlug: string }>;
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

export const generateStaticParams = async () => {
  const { regions } = await getGlobalData();

  if (!regions || regions.length === 0) {
    throw new AppError(
      "No active regions found. At least one active region is required to build this route. Ensure Firestore quota is not exceeded and active regions exist.",
      "BUILD_ERROR",
    );
  }

  return regions.map((region) => ({ regionSlug: region.slug }));
};

export const generateMetadata = async ({
  params,
}: RegionPageProps): Promise<Metadata> => {
  const { regionSlug } = await params;
  const { regions } = await getGlobalData();
  const region = regions.find((item) => item.slug === regionSlug);
  const title =
    region?.title ||
    (region
      ? `${region.name}${DICTIONARY.pages.regions.regionTitleSuffix} | ${DICTIONARY.global.brand}`
      : DICTIONARY.global.brand);
  const description =
    region?.metaDesc ||
    region?.description ||
    `${region?.name || DICTIONARY.global.city}${DICTIONARY.pages.regions.regionDescSuffix}`;
  const canonicalUrl = `${ROUTES.regionBase}/${regionSlug}`;
  const resolvedOgImage = region
    ? resolveAppImage({
        image: region.image,
        imageUrl: region.imageUrl,
        fallbackAlt: region.h1 || title,
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
          width: DICTIONARY.meta.og.image.width,
          height: DICTIONARY.meta.og.image.height,
          alt: resolvedOgImage?.alt || region?.h1 || title,
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
      images: [ogImage],
    },
  };
};

const RegionPage = async ({ params }: RegionPageProps) => {
  const { regionSlug } = await params;
  const { regions, pests } = await getGlobalData();
  const region = regions.find((item) => item.slug === regionSlug);

  if (!region) notFound();

  const activeCombinations = await getAllActiveCombinations();
  const sections = region.content ? parseHtmlIntoSections(region.content) : [];
  const pestDescriptions = new Map(
    pests.map((pest) => [pest.slug, pest.cardDescription]),
  );
  const resolvedSectionImage = resolveAppImage({
    image: region.image,
    imageUrl: region.imageUrl,
    fallbackAlt: region.h1 || region.name,
    preset: "section",
  });
  const sectionVisuals =
    sections.length > 1 && resolvedSectionImage
      ? {
          0: {
            id: "region-section",
            url: resolvedSectionImage.url,
            altText: resolvedSectionImage.alt,
          },
        }
      : undefined;
  const sectionFallbackIcons = sections.length > 1 ? { 0: MapPin } : undefined;

  const relatedLinks = activeCombinations
    .filter((combination) => combination.region === region.slug)
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
        type="region"
        regionSlug={region.slug}
        regionName={region.name}
      />
      {region.content && (
        <SeoContent
          sections={sections}
          sectionVisuals={sectionVisuals}
          sectionFallbackIcons={sectionFallbackIcons}
        />
      )}
      <RelatedLinksSection
        title={DICTIONARY.pages.services.heading}
        items={relatedLinks}
        viewAllHref={
          relatedLinks.length > 0
            ? `${ROUTES.regionBase}/${region.slug}${ROUTES.services}`
            : undefined
        }
        viewAllTitle={DICTIONARY.navbar.columns.viewAllPests}
        viewAllDescription={DICTIONARY.navbar.columns.viewAllPestsDesc}
        viewAllIcon="bug"
      />
      {region.faq && region.faq.length > 0 && <SeoFaq faq={region.faq} />}
      <CtaSection />
    </div>
  );
};

export default RegionPage;
