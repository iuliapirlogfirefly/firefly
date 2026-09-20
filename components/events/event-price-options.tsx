"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  MAX_PRICE_OPTIONS,
  PRICE_OPTION_NAME_MAX_LENGTH,
  type PriceOptionDraft,
} from "@/lib/utils/event-prices";

type Props = {
  value: PriceOptionDraft[];
  onChange: (next: PriceOptionDraft[]) => void;
  inputClass: string;
  labelClass: string;
};

export function EventPriceOptionsFields({
  value,
  onChange,
  inputClass,
  labelClass,
}: Props) {
  const t = useTranslations("event");

  const updateRow = (index: number, patch: Partial<PriceOptionDraft>) => {
    onChange(
      value.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row
      )
    );
  };

  return (
    <div>
      <p className={labelClass}>{t("priceOptions")}</p>
      <p className="mb-3 text-xs text-muted-foreground">{t("priceOptionsHint")}</p>
      <div className="space-y-3">
        {value.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_8rem_auto] gap-2 sm:grid-cols-[1fr_9rem_auto]">
            <div>
              <label className="sr-only" htmlFor={`price-option-name-${index}`}>
                {t("priceOptionName")}
              </label>
              <input
                id={`price-option-name-${index}`}
                className={inputClass}
                value={row.name}
                onChange={(event) =>
                  updateRow(index, { name: event.target.value })
                }
                maxLength={PRICE_OPTION_NAME_MAX_LENGTH}
                placeholder={t("priceOptionNamePlaceholder")}
              />
            </div>
            <div>
              <label className="sr-only" htmlFor={`price-option-amount-${index}`}>
                {t("priceOptionPrice")}
              </label>
              <input
                id={`price-option-amount-${index}`}
                type="number"
                className={inputClass}
                value={row.price}
                onChange={(event) =>
                  updateRow(index, { price: event.target.value })
                }
                min={0}
                step="0.01"
                placeholder={t("priceOptionPrice")}
              />
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center self-center rounded-xl text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
              onClick={() =>
                onChange(value.filter((_, rowIndex) => rowIndex !== index))
              }
              aria-label={t("removePriceOption")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      {value.length < MAX_PRICE_OPTIONS ? (
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-firefly transition-colors hover:text-firefly/80"
          onClick={() => onChange([...value, { name: "", price: "" }])}
        >
          <Plus className="h-4 w-4" />
          {t("addPriceOption")}
        </button>
      ) : null}
    </div>
  );
}
