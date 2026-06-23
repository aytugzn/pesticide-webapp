import React from "react";

const STYLES = {
  sectionWrapper: "relative w-full overflow-hidden bg-surface-neutral",
  blob: "absolute top-0 left-1/2 -translate-x-1/2 -mt-32 w-full max-w-5xl h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none",
  divider: "absolute top-0 left-1/2 -translate-x-1/2 w-4/5 max-w-5xl h-px bg-gradient-to-r from-transparent via-brand-primary/10 to-transparent pointer-events-none",
} as const;

interface AlternatingSectionsProps {
  children: React.ReactNode;
  wrapperClassName?: string;
  blobClassName?: string;
  dividerClassName?: string;
}

export const AlternatingSections = ({ 
  children,
  wrapperClassName = STYLES.sectionWrapper,
  blobClassName = STYLES.blob,
  dividerClassName = STYLES.divider,
}: AlternatingSectionsProps) => {
  return (
    <div className="flex flex-col w-full">
      {React.Children.map(children, (child, index) => (
        <div className={wrapperClassName} style={{ '--section-bg': 'var(--surface-neutral)' } as React.CSSProperties}>
          <div className="relative z-10 w-full">
            {child}
          </div>

          {/* Subtle elegant divider and its glow between sections */}
          {index !== 0 && (
            <>
              {/* The Glow (Gradient Blob) - Soft, wide, and low opacity */}
              <div className={blobClassName} aria-hidden="true" />
              
              {/* The Line */}
              <div className={dividerClassName} aria-hidden="true" />
            </>
          )}
        </div>
      ))}
    </div>
  );
};
