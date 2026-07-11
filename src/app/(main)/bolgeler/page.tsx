import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import { getGlobalData } from "@/features/settings/data";
import { CtaSection } from "@/components/layout/CtaSection";

const title = `${DICTIONARY.meta.regions.title} | ${DICTIONARY.global.brand}`;
const description = DICTIONARY.meta.regions.description;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: ROUTES.regions },
  openGraph: {
    title,
    description,
    url: ROUTES.regions,
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

const getRegionDescription = (name: string, cardDescription?: string) => {
  if (cardDescription) return cardDescription;

  return DICTIONARY.pages.regions.cardDescriptionTemplate.replace(
    "{region}",
    name,
  );
};

const RegionsPage = async () => {
  const { regions } = await getGlobalData();

  return (
    <>
      <PublicPageHeader
        eyebrow={DICTIONARY.pages.regions.eyebrow}
        title={DICTIONARY.pages.regions.heading}
        description={DICTIONARY.pages.regions.headerDesc}
      />
      <section className="bg-surface-neutral">
        <div className="max-w-7xl mx-auto px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((region) => (
              <li key={region.slug}>
                <Link
                  href={`${ROUTES.regionBase}/${region.slug}`}
                  className="group flex h-full min-h-64 flex-col bg-brand-surface border border-brand-border rounded-lg p-6 transition-all hover:border-brand-primary/50 hover:shadow-lg"
                >
                  <MapPin className="w-7 h-7 text-brand-primary mb-5 shrink-0" aria-hidden="true" />
                  <h2 className="font-heading font-bold text-text-primary text-xl leading-snug group-hover:text-brand-primary transition-colors">
                    {region.name}
                  </h2>
                  <p className="text-text-secondary text-sm leading-relaxed mt-4">
                    {getRegionDescription(region.name, region.cardDescription)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CtaSection />
    </>
  );
};

export default RegionsPage;
