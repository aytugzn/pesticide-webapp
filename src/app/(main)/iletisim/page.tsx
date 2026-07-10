import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import { ContactPageSection } from "@/features/contact/components/ContactPageSection";
import { getGlobalData } from "@/features/settings/data";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.contact.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.meta.contact.description,
  alternates: { canonical: ROUTES.contact },
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
