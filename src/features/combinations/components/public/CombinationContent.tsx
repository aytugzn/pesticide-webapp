import { cn } from "@/utils/cn";
import { AlternatingSections } from "@/components/layout/AlternatingSections";
import React from "react";
import { DICTIONARY } from "@/constants/dictionary";
import { getSectionIcons, type Section } from "../../utils";
import { SanitizedHtml } from "@/components/ui/SanitizedHtml";

type CombinationContentProps = {
  sections: Section[];
};

export const CombinationContent = ({ sections }: CombinationContentProps) => {
  const sectionIcons = getSectionIcons(sections);

  return (
    <article className="bg-surface-neutral overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24">
        {/* All Content Boxes */}
        {sections.length > 0 && (
          <AlternatingSections wrapperClassName="relative w-full overflow-hidden py-8 lg:py-12">
            {sections.map((section, idx) => {
              const isEven = idx % 2 === 0;
              const Icon = sectionIcons[idx];
              const IconComponent =
                Icon !== DICTIONARY.admin.ownerShortcut
                  ? (Icon as React.ElementType)
                  : null;

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col gap-8 lg:gap-16 items-center lg:items-stretch",
                    isEven ? "lg:flex-row" : "lg:flex-row-reverse",
                  )}
                >
                  {/* Visual Content Box */}
                  <div className="w-full lg:w-5/12">
                    <div className="w-full h-full min-h-52 lg:min-h-full rounded-lg bg-brand-surface/30 border border-brand-border flex items-center justify-center p-8">
                      {Icon === DICTIONARY.admin.ownerShortcut ? (
                        <div
                          className="w-56 h-56 bg-brand-primary opacity-10 mask-owner"
                          aria-hidden="true"
                        />
                      ) : IconComponent ? (
                        <IconComponent
                          className="w-32 h-32 text-brand-primary opacity-10"
                          strokeWidth={1}
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="w-full lg:w-7/12 space-y-6 relative z-10 flex flex-col justify-center">
                    {section.title && (
                      <h2 className="text-3xl lg:text-4xl font-heading font-bold text-text-primary leading-tight">
                        {section.title}
                      </h2>
                    )}
                    <SanitizedHtml
                      html={section.body}
                      className="prose prose-lg text-text-secondary leading-relaxed max-w-none prose-p:mb-4 prose-ul:mb-4 prose-li:mb-1 prose-strong:text-brand-primary"
                    />
                  </div>
                </div>
              );
            })}
          </AlternatingSections>
        )}
      </div>
    </article>
  );
};
