import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { PublicPageHeader } from "@/components/layouts/PublicPageHeader";
import { ContactSection } from "@/features/home/components/sections/ContactSection";
import { getGlobalData } from "@/features/settings/actions";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.contact.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.home.contact.description,
};

const ContactPage = async () => {
  const { pests, regions } = await getGlobalData();

  return (
    <>
      <PublicPageHeader
        eyebrow={DICTIONARY.navbar.links.contact}
        title={DICTIONARY.meta.contact.title}
        description={DICTIONARY.home.contact.description}
      />
      <ContactSection pests={pests} regions={regions} />
    </>
  );
};

export default ContactPage;
