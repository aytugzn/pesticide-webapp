import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { PublicPageHeader } from "@/components/layouts/PublicPageHeader";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.certificates.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.meta.certificates.description,
};

const CertificatesPage = () => (
  <>
      <PublicPageHeader
        eyebrow={DICTIONARY.footer.links.certificates}
        title={DICTIONARY.meta.certificates.title}
        description={DICTIONARY.meta.certificates.headerDesc}
      />
    <section className="bg-surface-neutral">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-brand-surface border border-brand-border rounded-lg p-8">
          <ShieldCheck className="w-10 h-10 text-brand-primary mb-5" aria-hidden="true" />
          <h2 className="font-heading font-bold text-text-primary text-2xl">
            {DICTIONARY.meta.certificates.feature1}
          </h2>
          <p className="text-text-secondary leading-relaxed mt-4">
            {DICTIONARY.meta.certificates.feature2}
            ve müşteri güvenliğini merkeze alan operasyon standartlarıyla çalışır.
            {DICTIONARY.meta.certificates.feature3}
          </p>
        </div>
      </div>
    </section>
  </>
);

export default CertificatesPage;
