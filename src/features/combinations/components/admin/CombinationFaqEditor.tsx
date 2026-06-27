"use client";

import { DICTIONARY } from "@/constants/dictionary";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type CombinationFaqEditorProps = {
  faq: { question: string; answer: string }[];
  onFaqChange: (
    index: number,
    field: "question" | "answer",
    value: string,
  ) => void;
};

/**
 * Renders the editable FAQ (SSS) section with dynamic question/answer pairs.
 */
export const CombinationFaqEditor = ({
  faq,
  onFaqChange,
}: CombinationFaqEditorProps) => {
  const d = DICTIONARY.admin.combinations;

  if (faq.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-text-primary">{d.faqTitle}</h3>
      {faq.map((item, index) => (
        <div
          key={index}
          className="bg-surface-neutral border border-brand-border rounded-brand-lg p-4 space-y-3"
        >
          <div className="flex flex-col space-y-1">
            <Input
              id={`faq-q-${index}`}
              label={`${d.faqQ} ${index + 1}`}
              value={item.question}
              onChange={(e) => onFaqChange(index, "question", e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <Textarea
              id={`faq-a-${index}`}
              label={`${d.faqA} ${index + 1}`}
              value={item.answer}
              onChange={(e) => onFaqChange(index, "answer", e.target.value)}
              rows={3}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
