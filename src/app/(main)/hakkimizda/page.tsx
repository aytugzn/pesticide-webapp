import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { PublicPageHeader } from "@/components/layouts/PublicPageHeader";
import { WhyUsSection } from "@/features/home/components/sections/WhyUsSection";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.about.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.home.whyUs.description,
};

const AboutPage = () => (
  <>
    <PublicPageHeader
      eyebrow={DICTIONARY.navbar.links.about}
      title={DICTIONARY.meta.about.title}
      description={DICTIONARY.home.whyUs.description}
    />
    <WhyUsSection />
  </>
);

export default AboutPage;
