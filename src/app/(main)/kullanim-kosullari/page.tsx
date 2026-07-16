import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";

const title = `${DICTIONARY.meta.terms.title} | ${DICTIONARY.global.brand}`;
const description = DICTIONARY.meta.terms.description;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: ROUTES.terms },
  openGraph: {
    title,
    description,
    url: ROUTES.terms,
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

const TermsPage = () => (
  <>
    <PublicPageHeader
      title={DICTIONARY.pages.terms.heading}
      description={DICTIONARY.meta.terms.description}
    />
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-16 leading-relaxed text-text-secondary sm:px-6 lg:px-8">
      <p>{DICTIONARY.pages.terms.content}</p>
      <aside className="space-y-2">
        <p>{DICTIONARY.pages.terms.googleProviderNotice}</p>
        <a
          href={DICTIONARY.pages.terms.googleProviderLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex font-medium text-brand-primary transition-colors hover:text-brand-primary-hover hover:underline"
        >
          {DICTIONARY.pages.terms.googleProviderLink.label}
        </a>
      </aside>
    </section>
  </>
);

export default TermsPage;
