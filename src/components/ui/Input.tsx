import React from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  optionalText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, optionalText, id, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor={id} className="text-sm font-bold text-text-primary">
          {label} {optionalText && <span className="block sm:inline font-normal text-text-muted">{optionalText}</span>}
        </label>
        <input
          id={id}
          ref={ref}
          className={cn(
            "w-full bg-surface-neutral border border-brand-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
