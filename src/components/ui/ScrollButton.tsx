"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { CLICK_EFFECT } from "@/constants/ui";
import { buttonVariants, buttonSizes, type ButtonVariant, type ButtonSize } from "@/components/ui/Button";

type ScrollButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  targetId: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/**
 * A client component button that smoothly scrolls to a specified target section
 * without changing the URL hash (better for SEO and history).
 */
export const ScrollButton = ({
  children,
  onClick,
  targetId,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ScrollButtonProps) => {

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (onClick) {
      onClick(e);
    }

    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
  };

  const classes = cn(
    variant !== "unstyled" && [
      "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
      CLICK_EFFECT,
    ],
    buttonVariants[variant],
    buttonSizes[size],
    className
  );

  return (
    <button onClick={handleClick} className={classes} {...props}>
      {children}
    </button>
  );
};
