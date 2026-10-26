const COUNTRY_NUMERIC: Record<string, number> = {
  RO: 642,
  DE: 276,
  FR: 250,
  IT: 380,
  ES: 724,
  GB: 826,
  US: 840,
  HU: 348,
  BG: 100,
  AT: 40,
  NL: 528,
  BE: 56,
  PL: 616,
  MD: 498,
};

const COUNTRY_NAMES: Record<string, string> = {
  RO: "Romania",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  GB: "United Kingdom",
  US: "United States",
  HU: "Hungary",
  BG: "Bulgaria",
  AT: "Austria",
  NL: "Netherlands",
  BE: "Belgium",
  PL: "Poland",
  MD: "Moldova",
};

export function splitPersonName(value: string): {
  firstName: string;
  lastName: string;
} {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Business", lastName: "Account" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function countryNumeric(code: string | null | undefined): number {
  const normalized = (code ?? "RO").trim().toUpperCase();
  return COUNTRY_NUMERIC[normalized] ?? 642;
}

export function countryName(code: string | null | undefined): string {
  const normalized = (code ?? "RO").trim().toUpperCase();
  return COUNTRY_NAMES[normalized] ?? normalized;
}
