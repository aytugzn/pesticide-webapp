import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";

const title = `${DICTIONARY.meta.kvkk.title} | ${DICTIONARY.global.brand}`;
const description = DICTIONARY.meta.kvkk.description;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: ROUTES.kvkk },
  openGraph: {
    title,
    description,
    url: ROUTES.kvkk,
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

const KvkkPage = () => (
  <>
    <PublicPageHeader
      title={DICTIONARY.pages.kvkk.heading}
      description={DICTIONARY.meta.kvkk.description}
    />
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-text-secondary leading-relaxed">
      <p>
        {DICTIONARY.pages.kvkk.content}
      </p>
    </section>
  </>
);

export default KvkkPage;
