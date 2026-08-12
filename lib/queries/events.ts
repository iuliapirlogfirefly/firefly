import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, shouldUseMockData } from "@/lib/supabase/config";
import { getLocalizedField } from "@/lib/i18n/content";
import { getDateRange } from "@/lib/filters/event-filters";
import { eventsToGeoJSON } from "@/lib/maps/geojson";
import type { Locale } from "@/types";
import type {
  CalendarDayEvents,
  CreateEventInput,
  EventDetail,
  EventFilters,
  EventListItem,
  EventsGeoJSON,
} from "@/types/events";
import type { Tables } from "@/types/database.types";
import { getSession } from "@/lib/auth/session";
import {
  getMockBusinessEvents,
  getMockCalendarEvents,
  getMockEventBySlug,
  getMockEvents,
  getMockEventsGeoJSON,
  getMockPendingEvents,
  getMockSavedEvents,
} from "@/lib/mocks/data";

type EventRow = Tables<"events">;

function mapEventToListItem(event: EventRow, locale: Locale): EventListItem {
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
  };
}

async function buildEventsQuery(
  filters: EventFilters,
  status: string = "published"
) {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("*")
    .eq("status", status)
    .order("is_promoted", { ascending: false })
    .order("starts_at", { ascending: true });

  if (filters.genre) query = query.eq("genre", filters.genre);
  if (filters.eventType) query = query.eq("event_type", filters.eventType);
  if (filters.promotedOnly) query = query.eq("is_promoted", true);

  const dateRange = getDateRange(filters);
  if (dateRange) {
    query = query
      .gte("starts_at", dateRange.start.toISOString())
      .lte("starts_at", dateRange.end.toISOString());
  }

  if (filters.search) {
    query = query.textSearch("search_vector", filters.search, {
      type: "websearch",
      config: "simple",
    });
  }

  return query;
}

export async function getEvents(
  locale: Locale,
  filters: EventFilters = {}
): Promise<EventListItem[]> {
  if (shouldUseMockData()) return getMockEvents(locale, filters);

  const { data, error } = await buildEventsQuery(filters);
  if (error) throw error;

  let events = data ?? [];

  if (filters.distanceKm && filters.lat && filters.lng) {
    const { data: nearby, error: distError } = await (
      await createClient()
    ).rpc("events_within_distance", {
      p_lat: filters.lat,
      p_lng: filters.lng,
      p_distance_km: filters.distanceKm,
    });
    if (distError) throw distError;
    const nearbyIds = new Set((nearby ?? []).map((e: EventRow) => e.id));
    events = events.filter((e) => nearbyIds.has(e.id));
  }

  return events.map((e) => mapEventToListItem(e, locale));
}

export async function getEventsGeoJSON(
  locale: Locale,
  filters: EventFilters = {}
): Promise<EventsGeoJSON> {
  if (shouldUseMockData()) return getMockEventsGeoJSON(locale, filters);

  const supabase = await createClient();
  const { data, error } = await buildEventsQuery(filters);
  if (error) throw error;
  return eventsToGeoJSON(data ?? [], locale);
}

export async function getEventBySlug(
  slug: string,
  locale: Locale
): Promise<EventDetail | null> {
  if (shouldUseMockData()) {
    const event = getMockEventBySlug(slug, locale);
    if (!event) return null;
    const savedIds = new Set(["mock-1", "mock-4", "mock-7"]);
    return { ...event, isSaved: savedIds.has(event.id) };
  }

  const supabase = await createClient();
  const session = await getSession();

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !event) return null;

  let isSaved = false;
  let isReminded = false;
  if (session.userId) {
    const { data: save } = await supabase
      .from("event_saves")
      .select("id")
      .eq("user_id", session.userId)
      .eq("event_id", event.id)
      .maybeSingle();
    isSaved = !!save;

    const { data: reminder } = await supabase
      .from("event_reminders")
      .select("id")
      .eq("user_id", session.userId)
      .eq("event_id", event.id)
      .is("sent_at", null)
      .maybeSingle();
    isReminded = !!reminder;
  }

  const listItem = mapEventToListItem(event, locale);

  return {
    ...listItem,
    description: getLocalizedField(
      event.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "description"
    ),
    address: event.address ?? "",
    ticketUrl: event.ticket_url,
    images: event.images ?? [],
    organizerName: null,
    isSaved,
    isReminded,
  };
}

export async function getCalendarEvents(
  locale: Locale,
  month: number,
  year: number,
  filters: EventFilters = {}
): Promise<CalendarDayEvents[]> {
  if (shouldUseMockData()) {
    return getMockCalendarEvents(locale, month, year, filters);
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("starts_at", start.toISOString())
    .lte("starts_at", end.toISOString())
    .order("starts_at", { ascending: true });

  if (filters.genre) query = query.eq("genre", filters.genre);
  if (filters.eventType) query = query.eq("event_type", filters.eventType);

  if (filters.search) {
    query = query.textSearch("search_vector", filters.search, {
      type: "websearch",
      config: "simple",
    });
  }

  const { data, error } = await query;
  if (error) throw error;

  const byDate = new Map<string, EventListItem[]>();
  for (const event of data ?? []) {
    const dateKey = event.starts_at.split("T")[0];
    const items = byDate.get(dateKey) ?? [];
    items.push(mapEventToListItem(event, locale));
    byDate.set(dateKey, items);
  }

  return Array.from(byDate.entries()).map(([date, events]) => ({
    date,
    events,
  }));
}

export async function getSavedEvents(
  locale: Locale
): Promise<EventListItem[]> {
  if (shouldUseMockData()) return getMockSavedEvents(locale);

  if (!isSupabaseConfigured()) return [];

  const session = await getSession();
  if (!session.userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_saves")
    .select("event_id, events(*)")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((row) => row.events as unknown as EventRow)
    .filter(Boolean)
    .map((e) => mapEventToListItem(e, locale));
}

export async function getBusinessEvents(
  businessAccountId: string,
  locale: Locale
): Promise<(EventListItem & { status: string })[]> {
  if (shouldUseMockData()) return getMockBusinessEvents(locale);

  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("business_account_id", businessAccountId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((e) => ({
    ...mapEventToListItem(e, locale),
    status: e.status,
  }));
}

export async function getBusinessEventForEdit(
  id: string,
  businessAccountId: string,
  locale: Locale
): Promise<(CreateEventInput & { id: string; status: string }) | null> {
  if (shouldUseMockData()) {
    const events = getMockBusinessEvents(locale);
    const event = events.find((e) => e.id === id);
    if (!event) return null;

    return {
      id: event.id,
      status: event.status,
      translations: { en: { title: event.title, description: "" } },
      startsAt: event.startsAt,
      endsAt: event.endsAt ?? undefined,
      genre: event.genre,
      eventType: event.eventType,
      price: event.price ?? undefined,
      coverImageUrl: event.coverImageUrl ?? undefined,
      images: [],
      venueName: event.venueName,
      lat: event.lat,
      lng: event.lng,
    };
  }

  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("business_account_id", businessAccountId)
    .single();

  if (error || !data) return null;

  const translations = data.translations as CreateEventInput["translations"];

  return {
    id: data.id,
    status: data.status,
    translations,
    startsAt: data.starts_at,
    endsAt: data.ends_at ?? undefined,
    genre: data.genre as CreateEventInput["genre"],
    eventType: data.event_type as CreateEventInput["eventType"],
    price: data.price ?? undefined,
    ticketUrl: data.ticket_url ?? undefined,
    coverImageUrl: data.cover_image_url ?? undefined,
    images: data.images ?? [],
    venueName: data.venue_name ?? undefined,
    address: data.address ?? undefined,
    lat: data.lat ?? undefined,
    lng: data.lng ?? undefined,
  };
}

export async function getPendingEvents(locale: Locale): Promise<
  (EventListItem & { status: string; rejectionReason: string | null })[]
> {
  if (shouldUseMockData()) return getMockPendingEvents(locale);

  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((e) => ({
    ...mapEventToListItem(e, locale),
    status: e.status,
    rejectionReason: e.rejection_reason,
  }));
}

export async function getAllAdminEvents(locale: Locale): Promise<
  (EventListItem & {
    status: string;
    source: string;
    publishedAt: string | null;
  })[]
> {
  if (shouldUseMockData()) {
    const pending = getMockPendingEvents(locale);
    const published = getMockEvents(locale, {});
    const seen = new Set<string>();
    const merged = [...pending, ...published].filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
    const mapped = merged.map((e) => ({
      ...e,
      status: ("status" in e && typeof e.status === "string"
        ? e.status
        : "published") as string,
      source: "business",
      publishedAt: e.startsAt as string | null,
    }));
    return mapped.sort((a, b) => {
      if (a.isPromoted !== b.isPromoted) return a.isPromoted ? -1 : 1;
      const aPublished = a.publishedAt ?? "";
      const bPublished = b.publishedAt ?? "";
      if (aPublished !== bPublished) return bPublished.localeCompare(aPublished);
      return 0;
    });
  }

  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("is_promoted", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((e) => ({
    ...mapEventToListItem(e, locale),
    status: e.status,
    source: e.source,
    publishedAt: e.published_at,
  }));
}

export async function getAdminEventForEdit(
  id: string,
  locale: Locale
): Promise<CreateEventInput & { id: string; status: string } | null> {
  if (shouldUseMockData()) {
    const all = await getAllAdminEvents(locale);
    const event = all.find((e) => e.id === id);
    if (!event) return null;
    return {
      id: event.id,
      status: event.status,
      translations: {
        en: { title: event.title, description: "" },
      },
      startsAt: event.startsAt,
      endsAt: event.endsAt ?? undefined,
      genre: event.genre,
      eventType: event.eventType,
      price: event.price ?? undefined,
      coverImageUrl: event.coverImageUrl ?? undefined,
      images: [],
      venueName: event.venueName,
      lat: event.lat ?? undefined,
      lng: event.lng ?? undefined,
    };
  }

  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const translations = data.translations as CreateEventInput["translations"];

  return {
    id: data.id,
    status: data.status,
    translations,
    startsAt: data.starts_at,
    endsAt: data.ends_at ?? undefined,
    genre: data.genre as CreateEventInput["genre"],
    eventType: data.event_type as CreateEventInput["eventType"],
    price: data.price ?? undefined,
    ticketUrl: data.ticket_url ?? undefined,
    coverImageUrl: data.cover_image_url ?? undefined,
    images: data.images ?? [],
    venueName: data.venue_name ?? undefined,
    address: data.address ?? undefined,
    lat: data.lat ?? undefined,
    lng: data.lng ?? undefined,
  };
}
