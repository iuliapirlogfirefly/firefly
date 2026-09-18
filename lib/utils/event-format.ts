import { dateTimeLocale } from "@/lib/i18n/date-locale";
import { LAUNCH_TIME_ZONE } from "@/lib/launch/config";

export function formatDateBadge(iso: string, locale = "en") {
  const dtLocale = dateTimeLocale(locale);
  return new Intl.DateTimeFormat(dtLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: LAUNCH_TIME_ZONE,
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale = "en") {
  return new Intl.DateTimeFormat(dateTimeLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: LAUNCH_TIME_ZONE,
  }).format(new Date(iso));
}

export function formatTimeRange(
  startsAt: string,
  endsAt: string | null,
  locale = "en"
) {
  const start = formatTime(startsAt, locale);
  if (!endsAt) return start;
  return `${start} — ${formatTime(endsAt, locale)}`;
}

export function formatPrice(
  price: number | null,
  t: (key: "freeEntry" | "fromPrice", values?: { price: number }) => string
) {
  if (price == null || price === 0) return t("freeEntry");
  return t("fromPrice", { price });
}
