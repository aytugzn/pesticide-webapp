"use client";

import { useId } from "react";
import { cn } from "@/utils/cn";

type SwitchProps = {
  id?: string;
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
};

export const Switch = ({
  id,
  label,
  checked,
  onChange,
  className,
  disabled,
}: SwitchProps) => {
  const generatedId = useId();
  const switchId = id || generatedId;
  const labelId = label ? `${switchId}-label` : undefined;

  const handleToggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={handleToggle}
        disabled={disabled}
        className="group inline-flex items-center gap-3 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-brand-primary group-focus-visible:ring-offset-2",
            checked
              ? "bg-brand-primary"
              : "border border-brand-border bg-brand-surface-muted",
            disabled && "cursor-not-allowed"
          )}
          aria-hidden="true"
        >
          <span
            className={cn(
              "pointer-events-none absolute left-0.5 block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform",
              checked ? "translate-x-5" : "translate-x-0",
            )}
          />
        </span>

        {label && (
          <span
            id={labelId}
            className="cursor-pointer select-none text-sm font-medium text-text-primary"
          >
            {label}
          </span>
        )}
      </button>
    </div>
  );
};
