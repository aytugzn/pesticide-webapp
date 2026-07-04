import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import { WhyUsSection } from "@/features/home/components/sections/WhyUsSection";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.about.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.meta.about.description,
  alternates: { canonical: ROUTES.about },
};

const AboutPage = () => (
  <>
    <PublicPageHeader
      eyebrow={DICTIONARY.pages.about.eyebrow}
      title={DICTIONARY.pages.about.heading}
      description={DICTIONARY.pages.about.headerDesc}
    />
    <WhyUsSection />
  </>
);

export default AboutPage;
