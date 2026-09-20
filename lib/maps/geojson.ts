import type { EventsGeoJSON, EventMapPoint } from "@/types/events";
import type { Tables } from "@/types/database.types";
import { getLocalizedField } from "@/lib/i18n/content";
import type { Locale } from "@/types";
import { normalizeGenres } from "@/lib/constants/genres";

type EventRow = Tables<"events">;

export function eventToMapPoint(
  event: EventRow,
  locale: Locale
): EventMapPoint {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [event.lng, event.lat],
    },
    properties: {
      id: event.id,
      slug: event.slug,
      title: getLocalizedField(
        event.translations as Parameters<typeof getLocalizedField>[0],
        locale,
        "title"
      ),
      isPromoted: event.is_promoted,
      promotionIntensity: event.promotion_intensity as 1 | 2 | 3,
      startsAt: event.starts_at,
      genres: normalizeGenres(event.genres),
    },
  };
}

export function eventsToGeoJSON(
  events: EventRow[],
  locale: Locale
): EventsGeoJSON {
  return {
    type: "FeatureCollection",
    features: events.map((e) => eventToMapPoint(e, locale)),
  };
}
