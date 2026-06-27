"use client";

import { Inter, Montserrat } from "next/font/google";
import { DICTIONARY } from "@/constants/dictionary";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalError = ({ error: _error, reset }: GlobalErrorProps) => {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${montserrat.variable} h-full`}
    >
      <body className="min-h-full flex flex-col items-center justify-center bg-surface-neutral p-4 font-sans text-center">
        <div className="max-w-md w-full bg-brand-surface border border-brand-border rounded-brand-xl p-8 shadow-sm flex flex-col items-center gap-6">
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
            <Button
              onClick={() => reset()}
              variant="primary"
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4" />
              {DICTIONARY.globalError.buttons.retry}
            </Button>

            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 bg-brand-surface-light hover:bg-brand-surface-muted text-text-primary border border-brand-border px-4 py-2.5 rounded-brand-md font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              {DICTIONARY.globalError.buttons.home}
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
