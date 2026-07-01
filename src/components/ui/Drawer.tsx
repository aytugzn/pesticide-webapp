"use client";

import { X } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { useScrollLock } from "@/hooks/useScrollLock";

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  side?: "left" | "right";
  overlayClassName?: string;
  closeAriaLabel?: string;
};

export const Drawer = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  side = "right",
  overlayClassName = "bg-overlay-strong backdrop-blur-sm",
  closeAriaLabel = DICTIONARY.navbar.mobileMenu.closeAria 
}: DrawerProps) => {
  useScrollLock(isOpen);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300",
          overlayClassName,
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )} 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <div 
        className={cn(
          "w-5/6 sm:w-96 fixed top-0 bottom-0 z-50 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out bg-brand-surface shadow-2xl",
          side === "right" ? "right-0" : "left-0",
          isOpen ? "translate-x-0" : (side === "right" ? "translate-x-full" : "-translate-x-full")
        )}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : DICTIONARY.navbar.mobileMenu.title}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-brand-border/50 shrink-0">
            <span className="font-heading font-bold text-lg text-text-primary">{title}</span>
            <Button 
              variant="unstyled" size="none"
              onClick={onClose} 
              className="p-2 -mr-2 text-text-primary rounded-md active:bg-foreground/10 transition-colors touch-manipulation"
              aria-label={closeAriaLabel}
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </Button>
          </div>
        )}

        <div className="flex flex-col p-6 space-y-6 flex-grow">
          {children}
        </div>
      </div>
    </>
  );
};
