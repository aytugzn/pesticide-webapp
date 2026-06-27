import React from "react";
import { cn } from "@/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  optionalText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, optionalText, id, ...props }, ref) => {
    if (props.type === "checkbox") {
      return (
        <label htmlFor={id} className={cn("flex items-center gap-2 cursor-pointer w-fit", className)}>
          <input
            id={id}
            ref={ref}
            type="checkbox"
            className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary/50"
            {...props}
          />
          <span className="text-sm font-medium text-text-primary">
            {label} {optionalText && <span className="font-normal text-text-muted">{optionalText}</span>}
          </span>
        </label>
      );
    }

    return (
      <div className="flex flex-col space-y-1 w-full">
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
        {props.maxLength && (
          <span className="text-xs text-text-muted self-end">
            {String(props.value || "").length}/{props.maxLength}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
