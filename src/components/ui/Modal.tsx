"use client";

import { useId } from "react";
import type { CSSProperties, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { DICTIONARY } from "@/constants/dictionary";
import { useScrollLock } from "@/hooks/useScrollLock";

const MODAL_STYLE: CSSProperties = {
  maxHeight: "calc(100dvh - 1.5rem)",
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  overlayClassName?: string;
  className?: string;
  closeAriaLabel?: string;
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  overlayClassName = "bg-overlay-strong backdrop-blur-sm",
  className,
  closeAriaLabel = DICTIONARY.global.ui.closeAria,
}: ModalProps) => {
  const titleId = useId();

  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 overflow-x-hidden transition-opacity duration-300",
          overlayClassName,
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden p-3 pointer-events-none sm:p-6">
        <section
          className={cn(
            "w-full max-w-lg max-w-full bg-brand-surface rounded-xl shadow-2xl flex flex-col overflow-hidden overflow-x-hidden pointer-events-auto transform transition-all duration-300",
            className,
          )}
          style={MODAL_STYLE}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
        >
          {title && (
            <header className="flex items-center justify-between gap-3 p-4 border-b border-brand-border/50 shrink-0 sm:p-5">
              <span
                id={titleId}
                className="min-w-0 break-words font-heading font-bold text-lg text-text-primary"
              >
                {title}
              </span>

              <Button
                variant="unstyled"
                size="none"
                onClick={onClose}
                className="min-h-10 min-w-10 shrink-0 p-2 -mr-2 text-text-muted hover:text-text-primary rounded-md transition-colors"
                aria-label={closeAriaLabel}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </Button>
            </header>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5">{children}</div>
        </section>
      </div>
    </>
  );
};
