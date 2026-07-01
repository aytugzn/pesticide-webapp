import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCombination,
  getAllActiveCombinations,
} from "@/features/combinations/actions";
import { parseHtmlIntoSections } from "@/features/combinations/utils";
import { getGlobalData } from "@/features/settings/actions";
import { CombinationContent } from "@/features/combinations/components/public/CombinationContent";
import { DICTIONARY } from "@/constants/dictionary";
import { CombinationJsonLd } from "./_components/CombinationJsonLd";
import { CombinationHero } from "@/features/combinations/components/public/CombinationHero";
import { CombinationFaq } from "@/features/combinations/components/public/CombinationFaq";
import { CombinationCta } from "@/features/combinations/components/public/CombinationCta";

type CombinationPageProps = {
  params: Promise<{ regionSlug: string; pestSlug: string }>;
};

/**
 * Generates static paths for all active combinations at build time.
 * Ensures each unique region-pest combination URL is pre-rendered.
 */
export const generateStaticParams = async () => {
  try {
    const combinations = await getAllActiveCombinations();

    if (!combinations || combinations.length === 0) {
      return [];
    }

    return combinations.map((c) => ({
      regionSlug: c.region,
      pestSlug: c.pest,
    }));
  } catch (error) {
    console.error("Failed to generate static params", error);
    return [];
  }
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

  return {
    title: data.title || DICTIONARY.meta.default.title,
    description: data.metaDesc || DICTIONARY.meta.default.description,
    openGraph: {
      title: data.title || DICTIONARY.meta.default.title,
      description: data.metaDesc || DICTIONARY.meta.default.description,
      url: canonicalUrl,
      images: data.ogImage
        ? [data.ogImage]
        : [DICTIONARY.meta.og.image.fallback],
      locale: DICTIONARY.meta.default.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: data.title || DICTIONARY.meta.default.title,
      description: data.metaDesc || DICTIONARY.meta.default.description,
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
  const [data, globalData] = await Promise.all([
    getCombination(regionSlug, pestSlug),
    getGlobalData(),
  ]);

  if (!data) notFound();

  const settings = globalData.settings || {};
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DICTIONARY.global.siteUrl;
  const canonicalUrl = `${baseUrl}/${regionSlug}/${pestSlug}`;

  // Use the pest's image as priority
  const pest = globalData.pests?.find((p) => p.slug === pestSlug);
  const imageUrl = pest?.imageUrl;

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
      <CombinationJsonLd
        data={data}
        settings={settings}
        regionSlug={regionSlug}
        baseUrl={baseUrl}
        canonicalUrl={canonicalUrl}
      />
      <CombinationHero
        data={data}
        sliderImages={sliderImages}
        regionSlug={regionSlug}
        pestSlug={pestSlug}
        regionName={data.regionName}
        pestName={data.pestName}
      />
      <CombinationContent sections={sections} />
      <CombinationFaq faq={data.faq || []} />
      <CombinationCta />
    </div>
  );
};

export default CombinationPage;
