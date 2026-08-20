export function formatDateBadge(iso: string, locale = "en-GB") {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale = "en-GB") {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTimeRange(
  startsAt: string,
  endsAt: string | null,
  locale = "en-GB"
) {
  const start = formatTime(startsAt, locale);
  if (!endsAt) return start;
  return `${start} — ${formatTime(endsAt, locale)}`;
}

export function formatPrice(price: number | null) {
  if (price == null || price === 0) return "Free entry";
  return `From ${price} lei`;
}
