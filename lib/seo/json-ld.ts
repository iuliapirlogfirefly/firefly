import { absoluteUrl } from "@/lib/seo/metadata";
import type { Locale } from "@/types";
import type { EventDetail, EventListItem } from "@/types/events";

export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function eventJsonLd(
  event: EventDetail,
  locale: Locale
): Record<string, unknown> {
  const image = event.coverImageUrl
    ? absoluteUrl(event.coverImageUrl)
    : absoluteUrl("/images/hero-frame-club.jpg");

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startsAt,
    ...(event.endsAt ? { endDate: event.endsAt } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image,
    url: absoluteUrl(`/${locale}/events/${event.slug}`),
    location: {
      "@type": "Place",
      name: event.venueName || "Bucharest",
      address: event.address || "Bucharest",
    },
  };
}

export function eventItemListJsonLd(
  events: EventListItem[],
  locale: Locale,
  name: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: event.title,
      url: absoluteUrl(`/${locale}/events/${event.slug}`),
    })),
  };
}
