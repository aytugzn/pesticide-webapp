import React from "react";
import { DICTIONARY } from "@/constants/dictionary";
import { cn } from "@/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  optionalText?: string;
  showCharacterCount?: boolean;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      optionalText,
      showCharacterCount = false,
      error,
      id,
      ...props
    },
    ref,
  ) => {
    const errorId = error && id ? `${id}-error` : undefined;
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
            error &&
              "border-error-border focus:border-error-border focus:ring-error-border/50",
            className
          )}
          aria-invalid={Boolean(error) || props["aria-invalid"]}
          aria-describedby={errorId || props["aria-describedby"]}
          {...props}
        />
        {error && (
          <span id={errorId} className="text-xs text-error-text">
            {error}
          </span>
        )}
        {showCharacterCount && props.maxLength && (
          <span
            className="text-xs text-text-muted self-end"
            aria-label={`${String(props.value || "").length} / ${props.maxLength} ${DICTIONARY.global.ui.characterCount}`}
          >
            {String(props.value || "").length} / {props.maxLength}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
