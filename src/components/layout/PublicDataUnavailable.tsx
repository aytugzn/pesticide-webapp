"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DICTIONARY } from "@/constants/dictionary";

/** Renders a retryable public state without converting provider outage to 404. */
export const PublicDataUnavailable = () => {
  const router = useRouter();

  return (
    <section className="flex-1 bg-surface-neutral px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-brand-xl border border-brand-border bg-brand-surface p-8 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-bg text-error-text">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <h1 className="font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            {DICTIONARY.publicUnavailable.title}
          </h1>
          <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
            {DICTIONARY.publicUnavailable.description}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-2"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
          {DICTIONARY.publicUnavailable.retry}
        </Button>
      </div>
    </section>
  );
};
