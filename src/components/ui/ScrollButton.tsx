"use client";

import { Button, type ButtonProps } from "@/components/ui/Button";

type ScrollButtonProps = Omit<ButtonProps, "href"> & {
  targetId: string;
};

/**
 * A client component button that smoothly scrolls to a specified target section
 * without changing the URL hash (better for SEO and history).
 */
export const ScrollButton = ({ 
  children,
  onClick,
  targetId,
  ...props 
}: ScrollButtonProps) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Call any custom onClick passed in (e.g., to close mobile menu)
    if (onClick) {
      onClick(e as any);
    }

    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Button onClick={handleClick} {...props as any}>
      {children}
    </Button>
  );
};
