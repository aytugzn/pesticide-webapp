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

export async function generateMetadata(): Promise<Metadata> {
  let defaultOgImage = DICTIONARY.meta.ogImageFallback;
  const title = DICTIONARY.meta.title;
  const description = DICTIONARY.meta.description;

  try {
    const ayarlarSnap = await adminDb.collection("settings").doc("general").get();
    const data = ayarlarSnap.data();
    if (data?.defaultOgImage) {
      defaultOgImage = data.defaultOgImage;
    }
  } catch (error) {
    console.error("Metadata fetch error:", error);
  }

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
