import type { EventPriceOption } from "@/types/events";

export const MAX_PRICE_OPTIONS = 8;
export const PRICE_OPTION_NAME_MAX_LENGTH = 40;

export type PriceOptionDraft = {
  name: string;
  price: string;
};

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function parsePriceOptions(value: unknown): EventPriceOption[] {
  if (!Array.isArray(value)) return [];

  const options: EventPriceOption[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const name =
      typeof record.name === "string" ? record.name.trim() : "";
    const price = asFiniteNumber(record.price);
    if (!name || price == null || price < 0) continue;
    options.push({
      name: name.slice(0, PRICE_OPTION_NAME_MAX_LENGTH),
      price,
    });
    if (options.length >= MAX_PRICE_OPTIONS) break;
  }
  return options;
}

export function normalizePriceOptions(
  options: EventPriceOption[] | undefined
): EventPriceOption[] {
  return parsePriceOptions(options ?? []);
}

export function lowestEventPrice(
  price: number | null | undefined,
  options: EventPriceOption[] = []
): number | null {
  const amounts = [
    ...(price != null && Number.isFinite(price) ? [price] : []),
    ...options.map((option) => option.price),
  ];
  if (amounts.length === 0) return null;
  return Math.min(...amounts);
}

export function draftsToPriceOptions(
  drafts: PriceOptionDraft[]
): { ok: true; options: EventPriceOption[] } | { ok: false } {
  const options: EventPriceOption[] = [];

  for (const draft of drafts) {
    const name = draft.name.trim();
    const rawPrice = draft.price.trim();
    if (!name && !rawPrice) continue;

    const price = asFiniteNumber(rawPrice);
    if (!name || price == null || price < 0) return { ok: false };

    options.push({
      name: name.slice(0, PRICE_OPTION_NAME_MAX_LENGTH),
      price,
    });
  }

  if (options.length > MAX_PRICE_OPTIONS) return { ok: false };
  return { ok: true, options };
}

export function optionsToDrafts(
  options: EventPriceOption[] | undefined
): PriceOptionDraft[] {
  return (options ?? []).map((option) => ({
    name: option.name,
    price: String(option.price),
  }));
}
