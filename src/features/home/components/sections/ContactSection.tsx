import { DICTIONARY } from "@/constants/dictionary";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ContactForm } from "../ContactForm";
import type { PestDoc, RegionDoc } from "@/types";

type ContactSectionProps = {
  pests: PestDoc[];
  regions: RegionDoc[];
};

export const ContactSection = ({ pests, regions }: ContactSectionProps) => {
  const data = DICTIONARY.home.contact;

  return (
    <section className="py-20 md:py-28 relative" id="contact" aria-labelledby="contact-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <SectionHeader
          id="contact-heading"
          eyebrow={data.title}
          titlePrefix={data.titlePrefix}
          titleHighlight={data.titleHighlight}
          description={data.description}
          align="center"
        />

        {/* Form Container */}
        <div className="mt-12">
          <ContactForm pests={pests} regions={regions} />
        </div>

      </div>
    </section>
  );
};
