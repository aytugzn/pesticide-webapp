import { DICTIONARY } from "@/constants/dictionary";
import { SeoFaqItem } from "./SeoFaqItem";

type SeoFaqProps = {
  faq: { question: string; answer: string }[];
};

export const SeoFaq = ({ faq }: SeoFaqProps) => {
  if (!faq || faq.length === 0) return null;

  return (
    <section className="bg-surface-neutral relative overflow-x-clip">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 rounded-full blur-3xl pointer-events-none z-0 opacity-5 bg-brand-primary"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-brand-primary/10 to-transparent"
        aria-hidden="true"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
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
