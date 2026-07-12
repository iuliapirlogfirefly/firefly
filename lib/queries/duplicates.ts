import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, shouldUseMockData } from "@/lib/supabase/config";
import { getLocalizedField } from "@/lib/i18n/content";
import type { Locale } from "@/types";
import type { EventListItem } from "@/types/events";
import type { Tables } from "@/types/database.types";

type EventRow = Tables<"events">;

export type DuplicateEventGroup = {
  groupKey: string;
  events: (EventListItem & { status: string; source: string })[];
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function duplicateKey(event: EventRow): string {
  const translations = event.translations as {
    en?: { title?: string };
  };
  const title = normalizeText(translations?.en?.title ?? "");
  const date = event.starts_at.slice(0, 10);
  const venue = normalizeText(event.venue_name ?? "");
  return `${title}|${date}|${venue}`;
}

function mapEvent(
  event: EventRow,
  locale: Locale
): EventListItem & { status: string; source: string } {
  return {
    id: event.id,
    slug: event.slug,
    title: getLocalizedField(
      event.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "title"
    ),
    venueName: event.venue_name ?? "",
    price: event.price,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    coverImageUrl: event.cover_image_url,
    genre: event.genre as EventListItem["genre"],
    eventType: event.event_type as EventListItem["eventType"],
    isPromoted: event.is_promoted,
    promotionIntensity: event.promotion_intensity as 1 | 2 | 3,
    lat: event.lat,
    lng: event.lng,
    status: event.status,
    source: event.source,
  };
}

function pairKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
}

export async function getDuplicateEventGroups(
  locale: Locale
): Promise<DuplicateEventGroup[]> {
  if (shouldUseMockData() || !isSupabaseConfigured()) return [];

  const supabase = await createClient();

  const [{ data: events, error }, { data: dismissals, error: dismissError }] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .neq("status", "archived")
        .order("starts_at", { ascending: true }),
      supabase.from("event_duplicate_dismissals").select("event_id_a, event_id_b"),
    ]);

  if (error) throw error;
  if (dismissError) throw dismissError;

  const dismissedPairs = new Set(
    (dismissals ?? []).map((d) => pairKey(d.event_id_a, d.event_id_b))
  );

  const groups = new Map<string, EventRow[]>();
  for (const event of events ?? []) {
    const key = duplicateKey(event);
    const translations = event.translations as { en?: { title?: string } };
    if (!normalizeText(translations?.en?.title ?? "")) continue;

    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }

  const result: DuplicateEventGroup[] = [];

  for (const [groupKey, groupEvents] of groups) {
    if (groupEvents.length < 2) continue;

    const hasUndismissedPair = groupEvents.some((a, i) =>
      groupEvents.slice(i + 1).some(
        (b) => !dismissedPairs.has(pairKey(a.id, b.id))
      )
    );

    if (!hasUndismissedPair) continue;

    result.push({
      groupKey,
      events: groupEvents.map((e) => mapEvent(e, locale)),
    });
  }

  return result;
}
