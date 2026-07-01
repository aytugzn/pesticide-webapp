import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layouts/PublicPageHeader";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.terms.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.meta.terms.description,
  alternates: { canonical: ROUTES.terms },
};

const TermsPage = () => (
  <>
    <PublicPageHeader
      title={DICTIONARY.meta.terms.title}
      description={DICTIONARY.meta.terms.description}
    />
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-text-secondary leading-relaxed">
      <p>
        {DICTIONARY.meta.terms.content}
      </p>
    </section>
  </>
);

export default TermsPage;
