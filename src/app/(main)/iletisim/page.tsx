import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import { ContactPageSection } from "@/features/contact/components/ContactPageSection";
import { getGlobalData } from "@/features/settings/data";

const title = `${DICTIONARY.meta.contact.title} | ${DICTIONARY.global.brand}`;
const description = DICTIONARY.meta.contact.description;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: ROUTES.contact },
  openGraph: {
    title,
    description,
    url: ROUTES.contact,
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

const ContactPage = async () => {
  const { pests, regions, settings } = await getGlobalData();

  return (
    <>
      <PublicPageHeader
        eyebrow={DICTIONARY.pages.contact.eyebrow}
        title={DICTIONARY.pages.contact.heading}
        description={DICTIONARY.pages.contact.headerDesc}
      />
      <ContactPageSection pests={pests} regions={regions} settings={settings} />
    </>
  );
};

export default ContactPage;
