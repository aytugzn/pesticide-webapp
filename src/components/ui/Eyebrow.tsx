import React from "react";
import { cn } from "@/utils/cn";

export type EyebrowProps = React.ComponentPropsWithoutRef<"span"> & {
  children: React.ReactNode;
};

export const Eyebrow = ({ children, className, ...props }: EyebrowProps) => {
  return (
    <span
      className={cn(
        "text-sm font-black text-brand-primary tracking-widest uppercase block",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};
