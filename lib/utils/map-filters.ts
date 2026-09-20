import type { Genre } from "@/types";
import type { EventListItem } from "@/types/events";
import { isEventExpired } from "@/lib/utils/event-expiry";
import { genresOverlap } from "@/lib/constants/genres";

export type DateFilter = "any" | "tonight" | "tomorrow" | "weekend";
export { isEventExpired };

export function matchesDateFilter(
  startsAt: string,
  filter: DateFilter,
  now = new Date()
): boolean {
  if (filter === "any") return true;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(startsAt);
  eventDate.setHours(0, 0, 0, 0);

  const diff = Math.round(
    (eventDate.getTime() - today.getTime()) / 86_400_000
  );

  if (filter === "tonight") return diff === 0;
  if (filter === "tomorrow") return diff === 1;
  if (filter === "weekend") {
    const day = eventDate.getDay();
    return diff >= 0 && diff <= 7 && (day === 5 || day === 6 || day === 0);
  }

  return true;
}

export function filterMapEvents<T extends EventListItem>(
  events: T[],
  options: {
    query: string;
    date: DateFilter;
    genres: Set<Genre>;
    eventTypes: Set<EventListItem["eventType"]>;
  }
): T[] {
  const normalizedQuery = options.query.trim().toLowerCase();

  return events.filter((event) => {
    if (isEventExpired(event)) return false;

    if (
      normalizedQuery &&
      !`${event.title} ${event.venueName}`
        .toLowerCase()
        .includes(normalizedQuery)
    ) {
      return false;
    }

    if (!matchesDateFilter(event.startsAt, options.date)) return false;
    if (options.genres.size > 0 && !genresOverlap(event.genres, options.genres)) {
      return false;
    }
    if (
      options.eventTypes.size > 0 &&
      !options.eventTypes.has(event.eventType)
    ) {
      return false;
    }

    return true;
  });
}
