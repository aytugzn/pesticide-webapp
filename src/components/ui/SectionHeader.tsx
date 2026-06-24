import React from "react";
import { cn } from "@/utils/cn";
import { Eyebrow } from "./Eyebrow";

export type SectionHeaderProps = {
  id?: string;
  eyebrow?: React.ReactNode;
  titlePrefix: string;
  titleHighlight?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export const SectionHeader = ({
  id,
  eyebrow,
  titlePrefix,
  titleHighlight,
  description,
  align = "left",
  className,
}: SectionHeaderProps) => {
  return (
    <header
      className={cn(
        "flex flex-col mb-10",
        align === "center"
          ? "items-center text-center mx-auto"
          : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <Eyebrow className="mb-3">
          {eyebrow}
        </Eyebrow>
      )}

      <h2
        id={id}
        className={cn(
          "font-heading font-black text-text-primary leading-tight mb-4",
          align === "center"
            ? "text-3xl md:text-4xl lg:text-5xl"
            : "text-4xl md:text-5xl lg:text-6xl",
        )}
      >
        {titlePrefix}
        {titleHighlight && (
          <span className="text-brand-primary"> {titleHighlight}</span>
        )}
      </h2>

      {description && (
        <p
          className={cn(
            "text-lg md:text-xl text-text-secondary leading-relaxed",
            align === "center" ? "max-w-2xl" : "max-w-xl",
          )}
        >
          {description}
        </p>
      )}
    </header>
  );
};
