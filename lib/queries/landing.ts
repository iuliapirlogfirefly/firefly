import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  shouldUseMockData,
} from "@/lib/supabase/config";
import { LAUNCH_TIME_ZONE } from "@/lib/launch/config";

export type LandingStats = {
  partiesThisMonth: number;
  venuesLitUp: number;
  nightsPlanned: number;
};

function partNumber(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): number {
  return Number(parts.find((part) => part.type === type)?.value);
}

function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const asUtc = Date.UTC(
    partNumber(parts, "year"),
    partNumber(parts, "month") - 1,
    partNumber(parts, "day"),
    partNumber(parts, "hour"),
    partNumber(parts, "minute"),
    partNumber(parts, "second")
  );
  return asUtc - date.getTime();
}

function zonedCivilToUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0);
  const firstOffset = tzOffsetMs(new Date(utcGuess), timeZone);
  const instant = utcGuess - firstOffset;
  const secondOffset = tzOffsetMs(new Date(instant), timeZone);
  return new Date(utcGuess - secondOffset);
}

export function getTimeZoneMonthRange(
  now = new Date(),
  timeZone = LAUNCH_TIME_ZONE
): { start: string; end: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = partNumber(parts, "year");
  const month = partNumber(parts, "month");
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return {
    start: zonedCivilToUtc(year, month, 1, timeZone).toISOString(),
    end: zonedCivilToUtc(nextYear, nextMonth, 1, timeZone).toISOString(),
  };
}

export function formatLandingCount(n: number): string {
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString("en-US");
}

export function hasLandingStats(stats: LandingStats): boolean {
  return (
    stats.partiesThisMonth > 0 ||
    stats.venuesLitUp > 0 ||
    stats.nightsPlanned > 0
  );
}

export async function getLandingStats(): Promise<LandingStats | null> {
  if (shouldUseMockData() || !isSupabaseAdminConfigured()) return null;

  try {
    const admin = createAdminClient();
    const { start, end } = getTimeZoneMonthRange();

    const [partiesResult, venuesResult, nightsResult] = await Promise.all([
      admin
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .gte("starts_at", start)
        .lt("starts_at", end),
      admin
        .from("events")
        .select("venue_id, venue_name")
        .eq("status", "published")
        .gte("starts_at", start)
        .lt("starts_at", end),
      admin.from("event_saves").select("*", { count: "exact", head: true }),
    ]);

    if (partiesResult.error || venuesResult.error || nightsResult.error) {
      return null;
    }

    const venues = new Set<string>();
    for (const row of venuesResult.data ?? []) {
      const key = row.venue_id ?? row.venue_name?.trim();
      if (key) venues.add(key);
    }

    return {
      partiesThisMonth: partiesResult.count ?? 0,
      venuesLitUp: venues.size,
      nightsPlanned: nightsResult.count ?? 0,
    };
  } catch {
    return null;
  }
}
