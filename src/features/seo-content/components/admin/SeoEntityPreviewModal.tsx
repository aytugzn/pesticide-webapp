"use client";

import { X } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { Button } from "@/components/ui/Button";
import { SeoContent } from "@/components/layouts/SeoContent";
import { SeoFaq } from "@/components/layouts/SeoFaq";
import { CtaSection } from "@/components/layouts/CtaSection";
import { parseHtmlIntoSections } from "@/utils/parseHtmlIntoSections";
import { useScrollLock } from "@/hooks/useScrollLock";
import { ServiceHero } from "@/components/layouts/ServiceHero";

export type SeoEntityPreviewModalProps = {
  entity: "pest" | "region";
  isOpen: boolean;
  onClose: () => void;
  data: {
    name: string;
    slug: string;
    title: string;
    h1: string;
    metaDesc: string;
    content: string;
    faq: { question: string; answer: string }[];
    imageUrl?: string;
  };
};

const ICON_SIZE = 24;

export const SeoEntityPreviewModal = ({
  entity,
  isOpen,
  onClose,
  data,
}: SeoEntityPreviewModalProps) => {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  const sections = data.content ? parseHtmlIntoSections(data.content) : [];
  
  const sliderImages =
    entity === "pest" && data.imageUrl
      ? [{ id: "pest-hero", url: data.imageUrl, altText: data.h1 || data.name }]
      : [];

  const h1Text =
    data.h1 ||
    (entity === "pest"
      ? `${data.name} ${DICTIONARY.pages.services.pestTitleSuffix}`
      : `${data.name}${DICTIONARY.pages.regions.regionTitleSuffix}`);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-brand-surface overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface shrink-0 shadow-sm z-10">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            {DICTIONARY.admin.preview.title}
          </h2>
          <p className="text-xs text-text-muted">
            {DICTIONARY.admin.preview.description}
          </p>
        </div>
        <Button
          variant="unstyled"
          size="none"
          onClick={onClose}
          className="p-2 bg-surface-neutral text-text-secondary rounded-full hover:bg-brand-surface-muted hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          aria-label={DICTIONARY.admin.preview.close}
          title={DICTIONARY.admin.preview.close}
        >
          <X size={ICON_SIZE} aria-hidden="true" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex-1 flex flex-col w-full">
          <ServiceHero
            h1={h1Text}
            sliderImages={sliderImages}
            type={entity}
            pestSlug={entity === "pest" ? data.slug : undefined}
            pestName={entity === "pest" ? data.name : undefined}
            regionSlug={entity === "region" ? data.slug : undefined}
            regionName={entity === "region" ? data.name : undefined}
          />
          <SeoContent sections={sections} />
          <SeoFaq faq={data.faq || []} />
          <CtaSection />
        </div>
      </div>
    </div>
  );
};
