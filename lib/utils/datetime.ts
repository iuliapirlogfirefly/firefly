import { LAUNCH_TIME_ZONE } from "@/lib/launch/config";

function partNumber(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): number {
  return Number(parts.find((part) => part.type === type)?.value);
}

function partValue(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): string {
  return parts.find((part) => part.type === type)?.value ?? "";
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

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone = LAUNCH_TIME_ZONE
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstOffset = tzOffsetMs(new Date(utcGuess), timeZone);
  const instant = utcGuess - firstOffset;
  const secondOffset = tzOffsetMs(new Date(instant), timeZone);
  return new Date(utcGuess - secondOffset);
}

export function isoToDatetimeLocal(
  iso: string | null | undefined,
  timeZone = LAUNCH_TIME_ZONE
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return `${partValue(parts, "year")}-${partValue(parts, "month")}-${partValue(parts, "day")}T${partValue(parts, "hour")}:${partValue(parts, "minute")}`;
}

export function datetimeLocalToIso(
  value: string,
  timeZone = LAUNCH_TIME_ZONE
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return new Date(value).toISOString();

  const [, year, month, day, hour, minute] = match;
  return zonedDateTimeToUtc(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    timeZone
  ).toISOString();
}
