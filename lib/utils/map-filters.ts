import type { EventListItem } from "@/types/events";

export type DateFilter = "any" | "tonight" | "tomorrow" | "weekend";

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
    genres: Set<EventListItem["genre"]>;
    eventTypes: Set<EventListItem["eventType"]>;
  }
): T[] {
  const normalizedQuery = options.query.trim().toLowerCase();

  return events.filter((event) => {
    if (
      normalizedQuery &&
      !`${event.title} ${event.venueName}`
        .toLowerCase()
        .includes(normalizedQuery)
    ) {
      return false;
    }

    if (!matchesDateFilter(event.startsAt, options.date)) return false;
    if (options.genres.size > 0 && !options.genres.has(event.genre)) {
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
