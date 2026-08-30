import type { EventType } from "@/types";

export const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isToday(dateKey: string, now = new Date()): boolean {
  return dateKey === toDateKey(now);
}

export function monthMatrix(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export function buildEventsByDate<T extends { startsAt: string }>(
  events: T[]
): Map<string, T[]> {
  const map = new Map<string, T[]>();

  for (const event of events) {
    const key = event.startsAt.slice(0, 10);
    const existing = map.get(key) ?? [];
    existing.push(event);
    map.set(key, existing);
  }

  return map;
}

export function parseCalendarMonthYear(
  searchParams: Record<string, string | string[] | undefined>,
  now = new Date()
): { month: number; year: number } {
  const rawMonth = searchParams.month;
  const rawYear = searchParams.year;
  const monthValue =
    typeof rawMonth === "string"
      ? rawMonth
      : Array.isArray(rawMonth)
        ? rawMonth[0]
        : undefined;
  const yearValue =
    typeof rawYear === "string"
      ? rawYear
      : Array.isArray(rawYear)
        ? rawYear[0]
        : undefined;

  const month = Number(monthValue);
  const year = Number(yearValue);

  return {
    month: month >= 1 && month <= 12 ? month : now.getMonth() + 1,
    year: year >= 2000 && year <= 2100 ? year : now.getFullYear(),
  };
}

export function updateCalendarSearchParams(
  current: URLSearchParams,
  patch: {
    month?: number;
    year?: number;
    eventType?: EventType | undefined;
  }
): URLSearchParams {
  const next = new URLSearchParams(current);

  next.delete("search");

  if ("month" in patch) {
    if (patch.month == null) next.delete("month");
    else next.set("month", String(patch.month));
  }

  if ("year" in patch) {
    if (patch.year == null) next.delete("year");
    else next.set("year", String(patch.year));
  }

  if ("eventType" in patch) {
    if (!patch.eventType) next.delete("eventType");
    else next.set("eventType", patch.eventType);
  }

  return next;
}
