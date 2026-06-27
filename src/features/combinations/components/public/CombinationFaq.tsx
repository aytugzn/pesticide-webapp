import { DICTIONARY } from "@/constants/dictionary";
import { CombinationFaqItem } from "./CombinationFaqItem";

type CombinationFaqProps = {
  faq: { question: string; answer: string }[];
};

export const CombinationFaq = ({ faq }: CombinationFaqProps) => {
  if (!faq || faq.length === 0) return null;

  return (
    <section className="bg-surface-neutral border-t border-brand-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="font-heading font-bold text-text-primary text-2xl sm:text-3xl mb-6 sm:mb-8 text-center sm:text-left">
          {DICTIONARY.global.faqTitle}
        </h2>

        <div className="space-y-3 sm:space-y-4">
          {faq.map((item, index) => (
            <CombinationFaqItem key={index} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};
