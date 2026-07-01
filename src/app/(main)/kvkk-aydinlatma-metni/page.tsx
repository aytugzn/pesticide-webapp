import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { PublicPageHeader } from "@/components/layouts/PublicPageHeader";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.kvkk.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.meta.kvkk.description,
};

const KvkkPage = () => (
  <>
    <PublicPageHeader
      title={DICTIONARY.meta.kvkk.title}
      description={DICTIONARY.meta.kvkk.description}
    />
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-text-secondary leading-relaxed">
      <p>
        Talep formları aracılığıyla iletilen ad, telefon, hizmet ve bölge bilgileri;
        geri dönüş sağlamak, hizmet sürecini planlamak ve kayıt tutmak amacıyla işlenir.
      </p>
    </section>
  </>
);

export default KvkkPage;
