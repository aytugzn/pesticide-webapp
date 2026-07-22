import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { DICTIONARY } from "@/constants/dictionary";
import { getAbsoluteUrl } from "@/utils/getAbsoluteUrl";
import { DEFAULT_PHONE } from "@/constants/ui";
import { normalizeTurkishPhone } from "@/utils/phone";
import { getPublicSettingsForMetadata } from "@/features/settings/data";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getPublicSettingsForMetadata();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DICTIONARY.global.siteUrl;
  const cleanSiteUrl = siteUrl.replace(/\/$/, "");
  const legacyDefaultOgImages = [
    "/og-image.png",
    `${cleanSiteUrl}/og-image.png`,
    `${DICTIONARY.global.siteUrl.replace(/\/$/, "")}/og-image.png`,
  ];
  const defaultOgImage =
    settings.defaultOgImage &&
    !legacyDefaultOgImages.includes(settings.defaultOgImage)
      ? settings.defaultOgImage
      : DICTIONARY.meta.og.image.fallback;
  const title = DICTIONARY.meta.default.title;
  const description = DICTIONARY.meta.default.description;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords: DICTIONARY.meta.default.keywords,
    authors: [{ name: DICTIONARY.meta.default.author }],
    publisher: DICTIONARY.meta.default.publisher,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      siteName: DICTIONARY.global.brand,
      images: [
        {
          url: defaultOgImage,
          width: DICTIONARY.meta.og.image.width,
          height: DICTIONARY.meta.og.image.height,
          alt: DICTIONARY.meta.default.alt,
          type: DICTIONARY.meta.og.image.type,
        },
      ],
      locale: DICTIONARY.meta.default.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      images: [defaultOgImage],
    },
  };
};

/** Builds optional LocalBusiness JSON-LD behind a request-safe boundary. */
const LocalBusinessJsonLd = async () => {
  const settings = await getPublicSettingsForMetadata();
  const phone = settings.phone || DEFAULT_PHONE;
  const email = settings.email || DICTIONARY.footer.contact.email;
  const address = settings.address || DICTIONARY.global.contact.address;
  const socialUrls = [
    settings.instagramUrl ?? DICTIONARY.social.instagram.url,
    settings.facebookUrl ?? DICTIONARY.social.facebook.url,
  ].filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${getAbsoluteUrl("/")}#localbusiness`,
    name: DICTIONARY.global.brand,
    description: DICTIONARY.meta.default.description,
    url: getAbsoluteUrl("/"),
    logo: getAbsoluteUrl(DICTIONARY.meta.og.image.fallback),
    image: getAbsoluteUrl(DICTIONARY.meta.og.image.fallback),
    telephone: normalizeTurkishPhone(phone),
    email,
    ...(socialUrls.length > 0 ? { sameAs: socialUrls } : {}),
    areaServed: DICTIONARY.global.city,
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressLocality: DICTIONARY.global.city,
      addressCountry: "TR",
    },
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

/** Keeps provider-backed root data inside a Cache Components boundary. */
const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html
    lang="tr"
    className={`${inter.variable} ${montserrat.variable} h-full`}
  >
    <body className="min-h-full flex flex-col">
      <LocalBusinessJsonLd />
      {children}
    </body>
  </html>
);

export default RootLayout;
