const TIME_ZONE = "Europe/Bucharest";

export type BucharestDateWindow =
  | "tonight"
  | "tomorrow"
  | "weekend"
  | "this_week"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DateRange = {
  start: Date;
  end: Date;
};

type CalendarDate = {
  year: number;
  month: number;
  day: number;
  weekday: number;
};

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const WINDOW_WEEKDAY: Partial<Record<BucharestDateWindow, number>> = {
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

function parts(
  instant: Date,
  timeZone: string
): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const value = parts(instant, timeZone);
  let hour = Number(value.hour);
  if (hour === 24) hour = 0;
  const asUtc = Date.UTC(
    Number(value.year),
    Number(value.month) - 1,
    Number(value.day),
    hour,
    Number(value.minute),
    Number(value.second)
  );
  return asUtc - instant.getTime();
}

function bucharestMidnightUtc(year: number, month: number, day: number): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offset = timeZoneOffsetMs(guess, TIME_ZONE);
  const midnight = new Date(guess.getTime() - offset);
  const offsetAtMidnight = timeZoneOffsetMs(midnight, TIME_ZONE);
  if (offsetAtMidnight !== offset) {
    return new Date(guess.getTime() - offsetAtMidnight);
  }
  return midnight;
}

function calendarFromInstant(instant: Date): CalendarDate {
  const value = parts(instant, TIME_ZONE);
  const weekday = WEEKDAY_INDEX[value.weekday] ?? 0;
  return {
    year: Number(value.year),
    month: Number(value.month),
    day: Number(value.day),
    weekday,
  };
}

function addCalendarDays(
  date: Pick<CalendarDate, "year" | "month" | "day">,
  days: number
): Pick<CalendarDate, "year" | "month" | "day"> {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function dayRange(
  date: Pick<CalendarDate, "year" | "month" | "day">
): DateRange {
  const start = bucharestMidnightUtc(date.year, date.month, date.day);
  const next = addCalendarDays(date, 1);
  const end = new Date(
    bucharestMidnightUtc(next.year, next.month, next.day).getTime() - 1
  );
  return { start, end };
}

export function bucharestDateWindow(
  window: BucharestDateWindow,
  now = new Date()
): DateRange {
  const today = calendarFromInstant(now);

  if (window === "tonight") return dayRange(today);

  if (window === "tomorrow") {
    return dayRange(addCalendarDays(today, 1));
  }

  if (window === "this_week") {
    const daysUntilSunday = (7 - today.weekday) % 7;
    const sunday = addCalendarDays(today, daysUntilSunday);
    return {
      start: dayRange(today).start,
      end: dayRange(sunday).end,
    };
  }

  if (window === "weekend") {
    if (today.weekday === 0) {
      const saturday = addCalendarDays(today, -1);
      return {
        start: dayRange(saturday).start,
        end: dayRange(today).end,
      };
    }
    const daysUntilSaturday = today.weekday === 6 ? 0 : 6 - today.weekday;
    const saturday = addCalendarDays(today, daysUntilSaturday);
    const sunday = addCalendarDays(saturday, 1);
    return {
      start: dayRange(saturday).start,
      end: dayRange(sunday).end,
    };
  }

  const target = WINDOW_WEEKDAY[window];
  if (target == null) return dayRange(today);
  const delta = (target - today.weekday + 7) % 7;
  return dayRange(addCalendarDays(today, delta));
}
