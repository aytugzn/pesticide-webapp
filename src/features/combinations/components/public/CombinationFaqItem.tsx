"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

type FaqItemProps = {
  item: { question: string; answer: string };
};

export const CombinationFaqItem = ({ item }: FaqItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        "group bg-brand-surface border border-brand-border rounded-brand-lg overflow-hidden transition-all duration-300",
        isOpen ? "shadow-md border-brand-primary/30" : ""
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 cursor-pointer text-text-primary font-semibold hover:bg-brand-surface-light transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        aria-expanded={isOpen}
      >
        <span className="text-left text-sm sm:text-base pr-4">{item.question}</span>
        <div
          className={cn(
            "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-brand-surface-light transition-transform duration-300",
            isOpen ? "rotate-180 bg-brand-primary/10 text-brand-primary" : "text-text-muted"
          )}
        >
          <ChevronDown aria-hidden="true" size={20} />
        </div>
      </button>
      <div
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 sm:px-6 pb-5 text-text-secondary leading-relaxed border-t border-brand-border/50 pt-4 text-sm sm:text-base">
            {item.answer}
          </div>
        </div>
      </div>
    </div>
  );
};
