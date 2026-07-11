import React from "react";

// Default variant — used by home page, about, contact. Unchanged.
const STYLES = {
  sectionWrapper: "relative w-full",
  blob: "absolute top-0 left-1/2 -translate-x-1/2 -mt-32 w-full max-w-3xl h-64 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none z-0",
  divider:
    "absolute top-0 left-1/2 -translate-x-1/2 w-4/5 max-w-5xl h-px bg-gradient-to-r from-transparent via-brand-primary/10 to-transparent pointer-events-none z-0",
} as const;

/**
 * Detail variant — used by pest/region/combination detail pages.
 * Provides a clean, visible h-px gradient divider between every high-level
 * section, plus a very soft glow that does NOT dominate the background.
 * No random large blobs. No blob overflow into padding.
 */
const DETAIL_STYLES = {
  sectionWrapper: "relative w-full",
  blob: "absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 rounded-full blur-3xl pointer-events-none z-0 opacity-5 bg-brand-primary",
  divider:
    "absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-brand-primary/10 to-transparent pointer-events-none z-0",
} as const;

type AlternatingSectionsProps = {
  children: React.ReactNode;
  /**
   * Use 'detail' for pest/region/combination detail pages.
   * Default is for home page and shared pages — do not change default behavior.
   */
  variant?: "default" | "detail";
  wrapperClassName?: string;
  blobClassName?: string;
  dividerClassName?: string;
};

export const AlternatingSections = ({
  children,
  variant = "default",
  wrapperClassName,
  blobClassName,
  dividerClassName,
}: AlternatingSectionsProps) => {
  const variantStyles = variant === "detail" ? DETAIL_STYLES : STYLES;
  const resolvedWrapper = wrapperClassName ?? variantStyles.sectionWrapper;
  const resolvedBlob = blobClassName ?? variantStyles.blob;
  const resolvedDivider = dividerClassName ?? variantStyles.divider;

  return (
    <div className="flex flex-col w-full relative bg-surface-neutral overflow-x-clip">
      {React.Children.map(children, (child, index) => {
        const isLast = index === React.Children.count(children) - 1;

        return (
          <div className={variantStyles.sectionWrapper}>
            {/* Divider + glow between sections (index > 0) */}
            {index !== 0 && (
              <>
                <div className={resolvedBlob} aria-hidden="true" />
                <div className={resolvedDivider} aria-hidden="true" />
              </>
            )}

            {/* Subtle highlight for the last section — default variant only */}
            {isLast && variant === "default" && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg aspect-square bg-brand-primary/5 rounded-full blur-2xl pointer-events-none z-0"
                aria-hidden="true"
              />
            )}

            <div className={resolvedWrapper}>
              <div className="relative z-10 w-full">{child}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
