"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { Button } from "@/components/ui/Button";
import { CombinationContent } from "../public/CombinationContent";
import { CombinationHero } from "../public/CombinationHero";
import { CombinationFaq } from "../public/CombinationFaq";
import { CombinationCta } from "../public/CombinationCta";
import { parseHtmlIntoSections } from "../../utils";

export type CombinationPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    h1: string;
    metaDesc: string;
    content: string;
    faq: { question: string; answer: string }[];
    regionSlug: string;
    pestSlug: string;
    regionName?: string;
    pestName?: string;
  };
};

const ICON_SIZE = 24;

/**
 * Full-screen preview modal that simulates the public combination page.
 * Reuses the actual public page sections to guarantee visual parity.
 */
export const CombinationPreviewModal = ({
  isOpen,
  onClose,
  data,
}: CombinationPreviewModalProps) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sections = data.content ? parseHtmlIntoSections(data.content) : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-brand-surface overflow-hidden">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface shrink-0 shadow-sm z-10">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            {DICTIONARY.admin.regions.previewModalTitle}
          </h2>
          <p className="text-xs text-text-muted">
            {DICTIONARY.admin.regions.previewModalDesc}
          </p>
        </div>
        <Button
          variant="unstyled"
          size="none"
          onClick={onClose}
          className="p-2 bg-surface-neutral text-text-secondary rounded-full hover:bg-brand-surface-muted hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          aria-label={DICTIONARY.admin.regions.previewClose}
          title={DICTIONARY.admin.regions.previewClose}
        >
          <X size={ICON_SIZE} aria-hidden="true" />
        </Button>
      </div>

      {/* Simulated page content — uses real public page components */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex-1 flex flex-col w-full">
          <CombinationHero
            data={data}
            sliderImages={[]}
            regionSlug={data.regionSlug}
            pestSlug={data.pestSlug}
            regionName={data.regionName}
            pestName={data.pestName}
          />
          <CombinationContent sections={sections} />
          <CombinationFaq faq={data.faq || []} />
          <CombinationCta />
        </div>
      </div>
    </div>
  );
};
