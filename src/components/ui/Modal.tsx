"use client";

import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { DICTIONARY } from "@/constants/dictionary";
import { useScrollLock } from "@/hooks/useScrollLock";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  overlayClassName?: string;
  className?: string;
  closeAriaLabel?: string;
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  overlayClassName = "bg-black/60 backdrop-blur-sm",
  className,
  closeAriaLabel = DICTIONARY.navbar.mobileMenu.closeAria,
}: ModalProps) => {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300",
          overlayClassName,
          isOpen ? "opacity-100" : "opacity-0"
        )} 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div 
          className={cn(
            "w-full max-w-lg bg-brand-surface rounded-xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto transform transition-all duration-300",
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0",
            className
          )}
          role="dialog"
          aria-modal="true"
        >
          {title && (
            <div className="flex items-center justify-between p-5 border-b border-brand-border/50 shrink-0">
              <span className="font-heading font-bold text-lg text-text-primary">{title}</span>
              <Button 
                variant="unstyled" size="none"
                onClick={onClose} 
                className="p-1.5 -mr-1.5 text-text-muted hover:text-text-primary rounded-md transition-colors"
                aria-label={closeAriaLabel}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
          )}
          
          <div className="flex flex-col p-5 flex-grow">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};
