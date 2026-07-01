import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layouts/PublicPageHeader";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.kvkk.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.meta.kvkk.description,
  alternates: { canonical: ROUTES.kvkk },
};

const KvkkPage = () => (
  <>
    <PublicPageHeader
      title={DICTIONARY.meta.kvkk.title}
      description={DICTIONARY.meta.kvkk.description}
    />
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-text-secondary leading-relaxed">
      <p>
        {DICTIONARY.meta.kvkk.content}
      </p>
    </section>
  </>
);

export default KvkkPage;
