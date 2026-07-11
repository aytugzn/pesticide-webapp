import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { AlternatingSections } from "@/components/layout/AlternatingSections";
import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WhyUsSection } from "@/features/home/components/sections/WhyUsSection";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: `${DICTIONARY.meta.about.title} | ${DICTIONARY.global.brand}`,
  description: DICTIONARY.meta.about.description,
  alternates: { canonical: ROUTES.about },
};

const AboutPage = () => (
  <>
    <PublicPageHeader
      eyebrow={DICTIONARY.pages.about.eyebrow}
      title={DICTIONARY.pages.about.heading}
      description={DICTIONARY.pages.about.headerDesc}
    />
    <AlternatingSections>
      <WhyUsSection variant="embedded" />
      <AboutApproachSection />
      <AboutPrinciplesSection />
      <AboutAudienceSection />
      <AboutProcessSection />
    </AlternatingSections>
  </>
);

const PROCESS_STEP_ICONS = [
  ClipboardList,
  Search,
  CalendarCheck,
  MessageCircle,
] as const satisfies readonly LucideIcon[];

const AboutApproachSection = () => {
  const aboutDict = DICTIONARY.pages.about;

  return (
    <section className="py-20 md:py-28" aria-labelledby="about-approach-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16 lg:items-center">
          <div className="lg:col-span-6">
            <SectionHeader
              id="about-approach-heading"
              eyebrow={aboutDict.approach.eyebrow}
              titlePrefix={aboutDict.approach.titlePrefix}
              titleHighlight={aboutDict.approach.titleHighlight}
              description={aboutDict.approach.description}
              className="mb-0"
            />
          </div>

          <div className="lg:col-span-6">
            {aboutDict.approach.cards.map((card) => (
              <article
                key={card.title}
                className="border-b border-brand-border py-6 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-primary-light text-brand-primary"
                    aria-hidden="true"
                  >
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-text-primary">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-text-secondary">
                      {card.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const AboutPrinciplesSection = () => {
  const aboutDict = DICTIONARY.pages.about;

  return (
    <section className="py-20 md:py-28" aria-labelledby="about-principles-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="about-principles-heading"
          eyebrow={DICTIONARY.pages.about.eyebrow}
          titlePrefix={aboutDict.principles.titlePrefix}
          titleHighlight={aboutDict.principles.titleHighlight}
          align="center"
        />

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-x-10 gap-y-0 md:grid-cols-2">
          {aboutDict.principles.items.map((item) => (
            <article
              key={item}
              className="flex gap-4 border-t border-brand-border py-5"
            >
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary"
                aria-hidden="true"
              />
              <h3 className="font-heading text-base font-bold leading-relaxed text-text-primary">
                {item}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const AboutAudienceSection = () => {
  const aboutDict = DICTIONARY.pages.about;

  return (
    <section className="py-20 md:py-28" aria-labelledby="about-audience-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <SectionHeader
              id="about-audience-heading"
              eyebrow={aboutDict.eyebrow}
              titlePrefix={aboutDict.audience.titlePrefix}
              titleHighlight={aboutDict.audience.titleHighlight}
              description={aboutDict.audience.description}
              className="mb-0"
            />
          </div>

          <div className="lg:col-span-7">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {aboutDict.audience.items.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-lg border border-brand-border bg-brand-surface px-4 py-3 shadow-sm shadow-brand-primary/5"
                >
                  <MapPin
                    className="h-5 w-5 shrink-0 text-brand-primary"
                    aria-hidden="true"
                  />
                  <span className="font-heading text-sm font-bold text-text-primary">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const AboutProcessSection = () => {
  const aboutDict = DICTIONARY.pages.about;

  return (
    <section className="py-20 md:py-28" aria-labelledby="about-process-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="about-process-heading"
          eyebrow={aboutDict.eyebrow}
          titlePrefix={aboutDict.process.titlePrefix}
          titleHighlight={aboutDict.process.titleHighlight}
          align="center"
        />

        <ol className="mx-auto grid max-w-6xl grid-cols-1 gap-0 md:grid-cols-4">
          {aboutDict.process.steps.map((step, index) => (
            <AboutProcessStep
              key={step.title}
              step={step}
              index={index}
              icon={PROCESS_STEP_ICONS[index] ?? CheckCircle2}
            />
          ))}
        </ol>
      </div>
    </section>
  );
};

const AboutProcessStep = ({
  step,
  index,
  icon: Icon,
}: {
  step: { title: string; description: string };
  index: number;
  icon: LucideIcon;
}) => (
  <li className="relative border-l border-brand-border py-6 pl-6 md:border-l-0 md:border-t md:pl-0 md:pr-6 md:pt-8">
    <span className="absolute -left-4 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-brand-surface md:-top-4 md:left-0">
      {index + 1}
    </span>
    <Icon className="mb-4 hidden h-6 w-6 text-brand-primary md:block" aria-hidden="true" />
    <h3 className="font-heading text-base font-bold text-text-primary">
      {step.title}
    </h3>
    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
      {step.description}
    </p>
  </li>
);

export default AboutPage;
