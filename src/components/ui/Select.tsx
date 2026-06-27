"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  id?: string;
  name: string;
  label?: string;
  optionalText?: string;
  options: SelectOption[];
  placeholder?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
};

export const Select = ({
  id,
  name,
  label,
  optionalText,
  options,
  placeholder = "",
  defaultValue = "",
  onChange,
  className,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Always holds the latest onChange without it being a dep in useCallback
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const selectedLabel = options.find((o) => o.value === selectedValue)?.label;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync when parent changes defaultValue (e.g. on reset)
  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

  const handleSelect = useCallback((value: string) => {
    setSelectedValue(value);
    setIsOpen(false);
    onChangeRef.current?.(value);
  }, []); // stable: setters are stable, onChange accessed via ref

  return (
    <div
      className={cn("relative w-full flex flex-col space-y-2", className)}
      ref={dropdownRef}
    >
      {/* Label (if provided) */}
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-text-primary">
          {label}{" "}
          {optionalText && (
            <span className="block sm:inline font-normal text-text-muted">
              {optionalText}
            </span>
          )}
        </label>
      )}

      {/* Hidden input to natively support HTML FormData */}
      <input type="hidden" name={name} value={selectedValue} />

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between bg-surface-neutral border rounded-xl px-4 py-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/50",
          isOpen ? "border-brand-primary" : "border-brand-border",
          !selectedValue ? "text-text-muted" : "text-text-primary",
        )}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-text-muted transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-brand-primary",
          )}
        />
      </button>

      {/* Dropdown Menu — always rendered, shown via CSS to prevent layout flicker */}
      <div
        role="listbox"
        aria-hidden={!isOpen}
        className={cn(
          "absolute top-full left-0 z-50 w-full mt-1 bg-brand-surface border border-brand-border rounded-xl shadow-2xl py-2 max-h-60 overflow-y-auto custom-scrollbar",
          "transition-all duration-150 ease-out origin-top",
          isOpen
            ? "opacity-100 scale-y-100 pointer-events-auto"
            : "opacity-0 scale-y-95 pointer-events-none",
        )}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={selectedValue === option.value}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-surface-neutral focus:bg-surface-neutral focus:outline-none",
              selectedValue === option.value
                ? "bg-brand-primary/10 text-brand-primary font-medium"
                : "text-text-primary",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
