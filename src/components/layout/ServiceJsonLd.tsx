import { getAbsoluteUrl } from "@/utils/getAbsoluteUrl";

type ServiceJsonLdProps = {
  name: string;
  description: string;
  url: string;
  areaServed: string;
  faq?: { question: string; answer: string }[];
};

export const ServiceJsonLd = ({
  name,
  description,
  url,
  areaServed,
  faq = [],
}: ServiceJsonLdProps) => {
  const absoluteUrl = getAbsoluteUrl(url);
  const businessId = `${getAbsoluteUrl("/")}#localbusiness`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name,
      description,
      provider: {
        "@id": businessId,
      },
      areaServed,
      url: absoluteUrl,
    },
    ...(faq.length > 0
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
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
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
};
