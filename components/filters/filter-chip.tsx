"use client";

import { ChevronDown } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

export function filterChipClass(active: boolean, open = false) {
  const on = active || open;
  return [
    "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
    on
      ? "border-firefly/50 bg-firefly/10 text-firefly"
      : "border-firefly/15 bg-surface-2/50 text-foreground/70 hover:border-firefly/30 hover:text-foreground",
  ].join(" ");
}

type FilterChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  open?: boolean;
  chevron?: boolean;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

export function FilterChip({
  active = false,
  open = false,
  chevron = false,
  children,
  className,
  ref,
  ...props
}: FilterChipProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={[filterChipClass(active, open), className]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={chevron ? undefined : active}
      {...props}
    >
      <span className="max-w-[10rem] truncate">{children}</span>
      {chevron ? (
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      ) : null}
    </button>
  );
}
