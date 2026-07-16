"use client";

import React, { useRef, useEffect } from "react";
import { DICTIONARY } from "@/constants/dictionary";
import { cn } from "@/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  optionalText?: string;
  showCharacterCount?: boolean;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      optionalText,
      showCharacterCount = false,
      error,
      id,
      onChange,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const errorId = error && id ? `${id}-error` : undefined;

    // Merge refs so both external and internal refs work
    const setRef = (node: HTMLTextAreaElement) => {
      internalRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const autoResize = () => {
      if (internalRef.current) {
        internalRef.current.style.height = "auto";
        internalRef.current.style.height = `${internalRef.current.scrollHeight}px`;
      }
    };

    // Resize on mount and value changes if value is passed
    useEffect(() => {
      autoResize();
    }, [props.value]);

    return (
      <div className="flex flex-col space-y-1 w-full">
        <label htmlFor={id} className="text-sm font-bold text-text-primary">
          {label}{" "}
          {optionalText && (
            <span className="block sm:inline font-normal text-text-muted">
              {optionalText}
            </span>
          )}
        </label>
        <textarea
          id={id}
          ref={setRef}
          onInput={(e) => {
            autoResize();
            props.onInput?.(e);
          }}
          onChange={onChange}
          className={cn(
            "w-full bg-surface-neutral border border-brand-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all overflow-hidden resize-none",
            error &&
              "border-error-border focus:border-error-border focus:ring-error-border/50",
            className,
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
  },
);

Textarea.displayName = "Textarea";
