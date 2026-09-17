"use client";

import { useTranslations } from "next-intl";
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

type AccountTypeSwitchProps = {
  value: AccountType;
  onChange: (value: AccountType) => void;
};

export function AccountTypeSwitch({ value, onChange }: AccountTypeSwitchProps) {
  const t = useTranslations("auth");

  return (
    <SegmentedSwitch
      value={value}
      onChange={onChange}
      options={[
        { value: "person", label: t("person") },
        { value: "business", label: t("business") },
      ]}
      ariaLabel={t("accountType")}
    />
  );
}

type BusinessTypeSwitchProps = {
  value: BusinessType;
  onChange: (value: BusinessType) => void;
};

export function BusinessTypeSwitch({ value, onChange }: BusinessTypeSwitchProps) {
  const t = useTranslations("auth");

  return (
    <SegmentedSwitch
      value={value}
      onChange={onChange}
      options={[
        { value: "venue", label: t("venue") },
        { value: "organizer", label: t("organizer") },
      ]}
      ariaLabel={t("businessTypeAria")}
    />
  );
}
