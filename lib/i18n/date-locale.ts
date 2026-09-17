import type { Locale } from "@/types";

export function dateTimeLocale(locale: string | Locale = "en"): string {
  return locale === "ro" ? "ro-RO" : "en-GB";
}
