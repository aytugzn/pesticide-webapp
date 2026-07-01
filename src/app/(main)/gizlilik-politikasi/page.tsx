import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layouts/PublicPageHeader";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.privacy.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.meta.privacy.description,
  alternates: { canonical: ROUTES.privacy },
};

const PrivacyPage = () => (
  <>
    <PublicPageHeader
      title={DICTIONARY.footer.links.privacy}
      description={DICTIONARY.meta.privacy.description}
    />
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-text-secondary leading-relaxed">
      <p>
        {DICTIONARY.meta.privacy.content}
      </p>
    </section>
  </>
);

export default PrivacyPage;
