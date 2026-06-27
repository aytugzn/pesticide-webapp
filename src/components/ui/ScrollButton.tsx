"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";

import { Button, type ButtonVariant, type ButtonSize } from "@/components/ui/Button";
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

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (onClick) {
      onClick(e);
    }

    scrollTo(targetId);
  };

  return (
    <Button 
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick} 
      {...props}
    >
      {children}
    </Button>
  );
};
