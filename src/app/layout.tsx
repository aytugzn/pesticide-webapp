import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { adminDb } from "@/lib/firebase-admin";
import { DICTIONARY } from "@/constants/dictionary";
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

import { unstable_cacheTag as cacheTag } from "next/cache";
import { parseSettingsDoc } from "@/utils/parsers";

async function getLayoutSettings() {
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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getLayoutSettings();
  let defaultOgImage = settings.defaultOgImage || DICTIONARY.meta.ogImageFallback;
  const title = DICTIONARY.meta.title;
  const description = DICTIONARY.meta.description;

  return {
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
}>) => (
  <html
    lang="tr"
    className={`${inter.variable} ${montserrat.variable} h-full`}
  >
    <body className="min-h-full flex flex-col">{children}</body>
  </html>
);

export default RootLayout;
