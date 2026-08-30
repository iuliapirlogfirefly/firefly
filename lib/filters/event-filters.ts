import { z } from "zod";
import type { EventFilters } from "@/types/events";

const genreSchema = z.enum([
  "techno",
  "house",
  "afro_house",
  "minimal",
  "hip_hop_rnb",
  "commercial",
  "latin",
  "manele",
  "pop",
  "edm",
  "live_music",
  "jazz",
  "open_format",
]);

const eventTypeSchema = z.enum([
  "party",
  "concert",
  "festival",
  "rooftop",
  "brunch_day_party",
  "social_gathering",
  "club_night",
  "live_performance",
  "private_event",
]);

const datePresetSchema = z.enum([
  "tonight",
  "tomorrow",
  "this_weekend",
  "this_week",
  "custom",
]);

export const eventFiltersSchema = z.object({
  genre: genreSchema.optional(),
  eventType: eventTypeSchema.optional(),
  datePreset: datePresetSchema.optional(),
  customDate: z.string().optional(),
  distanceKm: z.coerce.number().positive().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  promotedOnly: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "true"),
  search: z.string().optional(),
});

export function parseEventFilters(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): EventFilters {
  const raw: Record<string, string> = {};

  if (searchParams instanceof URLSearchParams) {
    searchParams.forEach((value, key) => {
      raw[key] = value;
    });
  } else {
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string") raw[key] = value;
      else if (Array.isArray(value) && value[0]) raw[key] = value[0];
    }
  }

  const parsed = eventFiltersSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

export function getDateRange(filters: EventFilters): {
  start: Date;
  end: Date;
} | null {
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (filters.datePreset) {
    case "tonight":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "tomorrow": {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { start: startOfDay(tomorrow), end: endOfDay(tomorrow) };
    }
    case "this_weekend": {
      const day = now.getDay();
      const daysUntilSaturday = (6 - day + 7) % 7;
      const saturday = new Date(now);
      saturday.setDate(saturday.getDate() + daysUntilSaturday);
      const sunday = new Date(saturday);
      sunday.setDate(sunday.getDate() + 1);
      return { start: startOfDay(saturday), end: endOfDay(sunday) };
    }
    case "this_week": {
      const end = new Date(now);
      end.setDate(end.getDate() + (7 - end.getDay()));
      return { start: startOfDay(now), end: endOfDay(end) };
    }
    case "custom":
      if (filters.customDate) {
        const custom = new Date(filters.customDate);
        return { start: startOfDay(custom), end: endOfDay(custom) };
      }
      return null;
    default:
      return null;
  }
}
