import type { Metadata } from "next";
import Link from "next/link";
import { Bug } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import { getGlobalData } from "@/features/settings/data";
import { CtaSection } from "@/components/layout/CtaSection";

const title = `${DICTIONARY.meta.services.title} | ${DICTIONARY.global.brand}`;
const description = DICTIONARY.meta.services.description;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: ROUTES.services },
  openGraph: {
    title,
    description,
    url: ROUTES.services,
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

const getServiceDescription = (service: string, cardDescription?: string) => {
  if (cardDescription) return cardDescription;

  const serviceTitle = `${service} ${DICTIONARY.pages.services.pestTitleSuffix}`;

  return DICTIONARY.pages.services.cardDescriptionTemplate.replace(
    "{service}",
    serviceTitle,
  );
};

const ServicesPage = async () => {
  const { pests } = await getGlobalData();

  return (
    <>
      <PublicPageHeader
        eyebrow={DICTIONARY.pages.services.eyebrow}
        title={DICTIONARY.pages.services.heading}
        description={DICTIONARY.pages.services.headerDesc}
      />
      <section className="bg-surface-neutral">
        <div className="max-w-7xl mx-auto px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pests.map((pest) => (
              <li key={pest.slug}>
                <Link
                  href={`${ROUTES.pestBase}/${pest.slug}`}
                  className="group flex h-full min-h-64 flex-col bg-brand-surface border border-brand-border rounded-lg p-6 transition-all hover:border-brand-primary/50 hover:shadow-lg"
                >
                  <Bug className="w-7 h-7 text-brand-primary mb-5 shrink-0" aria-hidden="true" />
                  <h2 className="font-heading font-bold text-text-primary text-xl leading-snug group-hover:text-brand-primary transition-colors">
                    {pest.name} {DICTIONARY.pages.services.pestTitleSuffix}
                  </h2>
                  <p className="text-text-secondary text-sm leading-relaxed mt-4">
                    {getServiceDescription(pest.name, pest.cardDescription)}
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

export default ServicesPage;
