import { getAbsoluteUrl } from "@/utils/getAbsoluteUrl";

export type BreadcrumbJsonLdProps = {
  items: { name: string; url: string }[];
};

export const BreadcrumbJsonLd = ({ items }: BreadcrumbJsonLdProps) => {
  if (!items || items.length < 2) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getAbsoluteUrl(item.url),
    })),
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
