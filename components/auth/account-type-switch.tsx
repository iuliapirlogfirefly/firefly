"use client";

import type { AccountType, BusinessType } from "@/types";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedSwitchProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  ariaLabel: string;
};

function SegmentedSwitch<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: SegmentedSwitchProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="grid gap-1 rounded-xl border border-border bg-surface-1/50 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              selected
                ? "bg-firefly text-primary-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const ACCOUNT_TYPE_OPTIONS: SegmentedOption<AccountType>[] = [
  { value: "person", label: "Person" },
  { value: "business", label: "Business" },
];

type AccountTypeSwitchProps = {
  value: AccountType;
  onChange: (value: AccountType) => void;
};

export function AccountTypeSwitch({ value, onChange }: AccountTypeSwitchProps) {
  return (
    <SegmentedSwitch
      value={value}
      onChange={onChange}
      options={ACCOUNT_TYPE_OPTIONS}
      ariaLabel="Account type"
    />
  );
}

const BUSINESS_TYPE_OPTIONS: SegmentedOption<BusinessType>[] = [
  { value: "venue", label: "Venue" },
  { value: "organizer", label: "Organizer" },
];

type BusinessTypeSwitchProps = {
  value: BusinessType;
  onChange: (value: BusinessType) => void;
};

export function BusinessTypeSwitch({ value, onChange }: BusinessTypeSwitchProps) {
  return (
    <SegmentedSwitch
      value={value}
      onChange={onChange}
      options={BUSINESS_TYPE_OPTIONS}
      ariaLabel="Business type"
    />
  );
}
