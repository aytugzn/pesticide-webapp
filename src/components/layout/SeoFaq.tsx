import { DICTIONARY } from "@/constants/dictionary";
import { SeoFaqItem } from "./SeoFaqItem";

type SeoFaqProps = {
  faq: { question: string; answer: string }[];
};

export const SeoFaq = ({ faq }: SeoFaqProps) => {
  if (!faq || faq.length === 0) return null;

  return (
    <section className="bg-surface-neutral border-t border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex w-full flex-col gap-6">
          <h2 className="font-heading font-black text-text-primary text-3xl sm:text-4xl leading-tight text-center sm:text-left">
            {DICTIONARY.global.faqTitle}
          </h2>

          <div className="w-full space-y-3 sm:space-y-4">
            {faq.map((item, index) => (
              <SeoFaqItem key={index} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
