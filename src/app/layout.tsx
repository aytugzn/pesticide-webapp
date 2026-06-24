import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { adminDb } from "@/lib/firebase-admin";
import { DICTIONARY } from "@/constants/dictionary";
import { cacheTag } from "next/cache";
import { parseSettingsDoc } from "@/utils/parsers";
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
    const settingsSnap = await adminDb.collection("settings").doc("general").get();
    return parseSettingsDoc(settingsSnap.data());
  } catch (error) {
    console.error(DICTIONARY.systemErrors.logs.layoutSettingsFetch, error);
    return {};
  }
}

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getLayoutSettings();
  let defaultOgImage = settings.defaultOgImage || DICTIONARY.meta.ogImageFallback;
  const title = DICTIONARY.meta.title;
  const description = DICTIONARY.meta.description;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://dmrilaclama.com"),
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: defaultOgImage,
          width: DICTIONARY.meta.ogImageWidth,
          height: DICTIONARY.meta.ogImageHeight,
          alt: DICTIONARY.meta.defaultAlt,
        },
      ],
      locale: DICTIONARY.meta.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage],
    },
  };
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": DICTIONARY.meta.title,
    "description": DICTIONARY.meta.description,
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://dmrilaclama.com",
    "areaServed": "İzmir, Turkey",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "İzmir",
      "addressCountry": "TR"
    }
  };

  return (
    <html
      lang="tr"
      className={`${inter.variable} ${montserrat.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
