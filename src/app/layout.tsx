import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { getAdminDb } from "@/lib/firebase-admin";
import { DICTIONARY } from "@/constants/dictionary";
import { cacheTag } from "next/cache";
import { parseSettingsDoc } from "@/utils/parsers";
import { getAbsoluteUrl } from "@/utils/getAbsoluteUrl";
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

const getLayoutSettings = async () => {
  "use cache";
  cacheTag("layout-settings");

  try {
    const settingsSnap = await getAdminDb()
      .collection("settings")
      .doc("general")
      .get();
    return parseSettingsDoc(settingsSnap.data());
  } catch (error) {
    console.error("Failed to fetch layout settings", error);
    return {};
  }
};

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getLayoutSettings();
  const defaultOgImage =
    settings.defaultOgImage || DICTIONARY.meta.og.image.fallback;
  const title = DICTIONARY.meta.default.title;
  const description = DICTIONARY.meta.default.description;

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || DICTIONARY.global.siteUrl,
    ),
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
      title,
      description,
      images: [
        {
          url: defaultOgImage,
          width: DICTIONARY.meta.og.image.width,
          height: DICTIONARY.meta.og.image.height,
          alt: DICTIONARY.meta.default.alt,
        },
      ],
      locale: DICTIONARY.meta.default.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage],
    },
  };
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${getAbsoluteUrl("/")}#localbusiness`,
    name: DICTIONARY.global.brand,
    description: DICTIONARY.meta.default.description,
    url: getAbsoluteUrl("/"),
    logo: getAbsoluteUrl(DICTIONARY.meta.og.image.fallback),
    image: getAbsoluteUrl(DICTIONARY.meta.og.image.fallback),
    sameAs: [
      DICTIONARY.social.instagram.url,
      DICTIONARY.social.facebook.url,
    ],
    areaServed: DICTIONARY.global.city,
    address: {
      "@type": "PostalAddress",
      streetAddress: DICTIONARY.global.contact.address,
      addressLocality: DICTIONARY.global.city,
      addressCountry: "TR",
    },
  };

  return (
    <html
      lang="tr"
      className={`${inter.variable} ${montserrat.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
