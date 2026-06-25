"use client";

import { DICTIONARY } from "@/constants/dictionary";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  unstable_retry?: () => void;
};

export default function ErrorBoundary({ error: _error, reset, unstable_retry }: ErrorProps) {
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-brand-surface border border-brand-border rounded-brand-xl p-8 shadow-sm flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 bg-error-bg rounded-full flex items-center justify-center text-error-text mb-2">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-heading font-bold text-text-primary">
            {DICTIONARY.globalError.title}
          </h1>
          <p className="text-text-secondary text-sm">
            {DICTIONARY.globalError.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
          <button
            onClick={() => {
              if (unstable_retry) {
                unstable_retry();
              } else {
                reset();
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-brand-surface px-4 py-2.5 rounded-brand-md font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {DICTIONARY.globalError.buttons.retry}
          </button>
          
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 bg-brand-surface-light hover:bg-brand-surface-muted text-text-primary border border-brand-border px-4 py-2.5 rounded-brand-md font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            {DICTIONARY.globalError.buttons.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
