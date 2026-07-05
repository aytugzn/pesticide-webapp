"use client";

import type { CSSProperties } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/utils/cn";

export type AdminToastVariant = "success" | "error" | "info" | "warning";

type AdminToastProps = {
  variant: AdminToastVariant;
  title: string;
  message: string;
  durationMs: number;
  onClose: () => void;
  closeAriaLabel: string;
};

const TOAST_ICON_SIZE = 18;

/** Fixed admin toast presentation with variant icon, progress bar, and a11y roles. */
export const AdminToast = ({
  variant,
  title,
  message,
  durationMs,
  onClose,
  closeAriaLabel,
}: AdminToastProps) => {
  const Icon =
    variant === "success"
      ? CheckCircle2
      : variant === "warning"
        ? TriangleAlert
        : variant === "error"
          ? AlertCircle
          : Info;
  const isAssertive = variant === "error" || variant === "warning";
  const progressStyle: CSSProperties = {
    animationDuration: `${durationMs}ms`,
  };

  return (
    <aside className="fixed left-3 right-3 top-4 z-50 pointer-events-none sm:left-auto sm:right-4 sm:w-auto">
      <div
        className={cn(
          "pointer-events-auto relative flex w-full max-w-md items-start gap-3 overflow-hidden rounded-brand-lg border p-4 pb-5 shadow-2xl backdrop-blur-xl bg-brand-surface/85 text-sm font-medium sm:w-fit sm:min-w-80",
          variant === "success" &&
            "border-success-border/70 text-success-text bg-success-bg/70 shadow-success-text/10",
          variant === "info" &&
            "border-info-border/70 text-info-text bg-info-bg/70 shadow-info-text/10",
          variant === "warning" &&
            "border-brand-primary/60 text-brand-primary bg-brand-primary-light/70 shadow-brand-primary/10",
          variant === "error" &&
            "border-error-border/70 text-error-text bg-error-bg/70 shadow-error-text/10",
        )}
        role={isAssertive ? "alert" : "status"}
        aria-live={isAssertive ? "assertive" : "polite"}
        aria-atomic="true"
      >
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border bg-brand-surface/60",
            variant === "success" && "border-success-border text-success-text",
            variant === "info" && "border-info-border text-info-text",
            variant === "warning" && "border-brand-primary text-brand-primary",
            variant === "error" && "border-error-border text-error-text",
          )}
        >
          <Icon size={TOAST_ICON_SIZE} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-text-primary">
            {title}
          </p>
          <p className="mt-1 leading-relaxed text-text-secondary">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-m-2 min-h-10 min-w-10 rounded-brand-sm p-2 text-text-muted transition-colors hover:bg-brand-surface-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          aria-label={closeAriaLabel}
        >
          <X size={TOAST_ICON_SIZE} aria-hidden="true" />
        </button>
        <span
          className={cn(
            "absolute inset-x-0 bottom-0 h-1 origin-left animate-toast-progress",
            variant === "success" && "bg-success-text",
            variant === "info" && "bg-info-text",
            variant === "warning" && "bg-brand-primary",
            variant === "error" && "bg-error-text",
          )}
          style={progressStyle}
          aria-hidden="true"
        />
      </div>
    </aside>
  );
};
