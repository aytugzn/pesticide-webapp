"use client";

import type {
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";

import {
  Button,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/Button";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

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
 * Includes robust user-interruptible requestAnimationFrame logic.
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
  const scrollTo = useSmoothScroll();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    onClick?.(event);
    scrollTo(targetId);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      {...props}
      type="button"
      onClick={handleClick}
    >
      {children}
    </Button>
  );
};
