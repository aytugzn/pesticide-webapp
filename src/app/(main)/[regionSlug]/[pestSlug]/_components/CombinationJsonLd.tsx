import { DICTIONARY } from "@/constants/dictionary";

import type { CombinationDoc, SettingsDoc } from "@/types";

type JsonLdProps = {
  data: CombinationDoc;
  settings: SettingsDoc;
  regionSlug: string;
  baseUrl: string;
  canonicalUrl: string;
};

export const CombinationJsonLd = ({
  data,
  settings,
  regionSlug,
  baseUrl,
  canonicalUrl,
}: JsonLdProps) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        name: DICTIONARY.global.brand,
        url: baseUrl,
        telephone: settings.phone || "",
        address: {
          "@type": "PostalAddress",
          addressLocality: DICTIONARY.global.city,
          streetAddress: DICTIONARY.footer.contact.address,
        },
        areaServed: data.h1 || regionSlug,
      },
      {
        "@type": "Service",
        name:
          data.title ||
          `${regionSlug} ${DICTIONARY.home.services.pestTitleSuffix}`,
        provider: { "@type": "LocalBusiness", name: DICTIONARY.global.brand },
        areaServed: regionSlug,
        url: canonicalUrl,
      },
      ...(data.faq && data.faq.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: data.faq.map((item: { question: string; answer: string }) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
};
