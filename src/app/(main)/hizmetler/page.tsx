import type { Metadata } from "next";
import Link from "next/link";
import { Bug } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { PublicPageHeader } from "@/components/layouts/PublicPageHeader";
import { getGlobalData } from "@/features/settings/actions";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.services.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.home.services.description,
};

const ServicesPage = async () => {
  const { pests } = await getGlobalData();

  return (
    <>
      <PublicPageHeader
        eyebrow={DICTIONARY.navbar.links.services}
        title={DICTIONARY.footer.links.services}
        description={DICTIONARY.home.services.description}
      />
      <section className="bg-surface-neutral">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pests.map((pest) => (
            <Link
              key={pest.slug}
              href={`${ROUTES.pestBase}/${pest.slug}`}
              className="group bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-primary/50 hover:shadow-lg transition-all"
            >
              <Bug className="w-7 h-7 text-brand-primary mb-5" aria-hidden="true" />
              <h2 className="font-heading font-bold text-text-primary text-xl group-hover:text-brand-primary transition-colors">
                {pest.name} {DICTIONARY.home.services.pestTitleSuffix}
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mt-3">
                {pest.description || DICTIONARY.home.services.defaultPestDesc}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
};

export default ServicesPage;
