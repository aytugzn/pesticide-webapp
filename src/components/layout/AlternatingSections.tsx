import React from "react";

// Reduced blur intensity and removed complex blends for performance
const STYLES = {
  sectionWrapper: "relative w-full",
  blob: "absolute top-0 left-1/2 -translate-x-1/2 -mt-32 w-full max-w-3xl h-64 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none z-0",
  divider:
    "absolute top-0 left-1/2 -translate-x-1/2 w-4/5 max-w-5xl h-px bg-gradient-to-r from-transparent via-brand-primary/10 to-transparent pointer-events-none z-0",
} as const;

type AlternatingSectionsProps = {
  children: React.ReactNode;
  wrapperClassName?: string;
  blobClassName?: string;
  dividerClassName?: string;
};

export const AlternatingSections = ({
  children,
  wrapperClassName = STYLES.sectionWrapper,
  blobClassName = STYLES.blob,
  dividerClassName = STYLES.divider,
}: AlternatingSectionsProps) => {
  return (
    <div className="flex flex-col w-full relative bg-surface-neutral overflow-x-clip">
      {React.Children.map(children, (child, index) => {
        const isLast = index === React.Children.count(children) - 1;

        return (
          <div className={wrapperClassName}>
            <div className="relative z-10 w-full">{child}</div>

            {/* Subtle highlight for the last section instead of expensive mix-blend */}
            {isLast && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg aspect-square bg-brand-primary/5 rounded-full blur-2xl pointer-events-none z-0"
                aria-hidden="true"
              />
            )}

            {/* Subtle elegant divider and its glow between sections */}
            {index !== 0 && (
              <>
                <div className={blobClassName} aria-hidden="true" />
                <div className={dividerClassName} aria-hidden="true" />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
