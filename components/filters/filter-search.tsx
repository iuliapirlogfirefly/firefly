"use client";

import { Search } from "lucide-react";

type FilterSearchProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

export function FilterSearch({
  value,
  placeholder,
  onChange,
}: FilterSearchProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-firefly/10 bg-surface-2/60 py-3 pl-10 pr-3 text-sm transition-colors placeholder:text-foreground/40 focus:border-firefly/50 focus:outline-none"
      />
    </div>
  );
}
