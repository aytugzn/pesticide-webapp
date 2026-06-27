import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";

export const CombinationCta = () => {
  return (
    <section className="bg-brand-primary">
      <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16 text-center">
        <h2 className="font-heading font-bold text-brand-surface text-2xl sm:text-3xl mb-4">
          {DICTIONARY.home.contact.titlePrefix}{" "}
          {DICTIONARY.home.contact.titleHighlight}
        </h2>
        <p className="text-brand-surface/80 mb-8 max-w-xl mx-auto">
          {DICTIONARY.home.contact.description}
        </p>
        <a
          href={ROUTES.contact}
          className="inline-block bg-brand-surface text-brand-primary font-semibold px-8 py-3.5 rounded-brand-lg hover:bg-brand-surface-light transition-colors"
        >
          {DICTIONARY.navbar.links.contact}
        </a>
      </div>
    </section>
  );
};
