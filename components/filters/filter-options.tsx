"use client";

import { Check } from "lucide-react";

export type FilterOption<T> = {
  value: T;
  label: string;
};

type FilterOptionsProps<T> = {
  options: FilterOption<T>[];
  value: T;
  labelledBy?: string;
  onChange: (value: T) => void;
};

export function FilterOptions<T>({
  options,
  value,
  labelledBy,
  onChange,
}: FilterOptionsProps<T>) {
  return (
    <div
      role="listbox"
      aria-labelledby={labelledBy}
      className="py-0.5"
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={String(option.value)}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`flex w-full items-center justify-between gap-4 px-3.5 py-2.5 text-left text-sm transition-colors ${
              selected
                ? "bg-firefly/10 text-firefly"
                : "text-foreground/80 hover:bg-firefly/10 hover:text-firefly"
            }`}
          >
            <span>{option.label}</span>
            {selected ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
          </button>
        );
      })}
    </div>
  );
}
