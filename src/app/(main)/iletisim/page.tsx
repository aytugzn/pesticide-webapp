import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import { ContactSection } from "@/features/home/components/sections/ContactSection";
import { getGlobalData } from "@/features/settings/actions";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.contact.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.meta.contact.description,
  alternates: { canonical: ROUTES.contact },
};

const ContactPage = async () => {
  const { pests, regions } = await getGlobalData();

  return (
    <>
      <PublicPageHeader
        eyebrow={DICTIONARY.pages.contact.eyebrow}
        title={DICTIONARY.pages.contact.heading}
        description={DICTIONARY.pages.contact.headerDesc}
      />
      <ContactSection pests={pests} regions={regions} />
    </>
  );
};

export default ContactPage;
