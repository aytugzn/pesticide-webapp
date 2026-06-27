"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  optionalText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, optionalText, id, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);

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
            className,
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
  },
);

Textarea.displayName = "Textarea";
