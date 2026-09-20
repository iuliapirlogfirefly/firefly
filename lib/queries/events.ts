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
  activeEventsOrFilter,
  isEventExpired,
} from "@/lib/utils/event-expiry";
import {
  getMockAdminEventRow,
  getMockBusinessEvents,
  getMockCalendarEvents,
  getMockEventBySlug,
  getMockEvents,
  getMockEventsGeoJSON,
  getMockPendingEvents,
  getMockSavedEvents,
} from "@/lib/mocks/data";
import {
  emptyPage,
  ilikeContains,
  paginateItems,
  rangeForPage,
  toPaginated,
  type Paginated,
} from "@/lib/admin/pagination";
import { normalizeGenres } from "@/lib/constants/genres";
import { parsePriceOptions } from "@/lib/utils/event-prices";

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
    priceOptions: parsePriceOptions(event.price_options),
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    coverImageUrl: event.cover_image_url,
    genres: normalizeGenres(event.genres),
    genreOther: event.genre_other,
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
    .or(activeEventsOrFilter())
    .order("is_promoted", { ascending: false })
    .order("starts_at", { ascending: true });

  if (filters.genre) query = query.overlaps("genres", [filters.genre]);
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

  return events
    .map((e) => mapEventToListItem(e, locale))
    .filter((event) => !isEventExpired(event));
}

export async function getMapPinCount(): Promise<number> {
  if (shouldUseMockData()) return getMockEvents("en").length;
  if (!isSupabaseConfigured()) return 0;

  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .or(activeEventsOrFilter());
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getEventsGeoJSON(
  locale: Locale,
  filters: EventFilters = {}
): Promise<EventsGeoJSON> {
  if (shouldUseMockData()) return getMockEventsGeoJSON(locale, filters);

  const supabase = await createClient();
  const { data, error } = await buildEventsQuery(filters);
  if (error) throw error;
  const active = (data ?? []).filter(
    (event) =>
      !isEventExpired({ startsAt: event.starts_at, endsAt: event.ends_at })
  );
  return eventsToGeoJSON(active, locale);
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

  const listItem = mapEventToListItem(event, locale);
  if (isEventExpired(listItem)) return null;

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

  return {
    ...listItem,
    description: getLocalizedField(
      event.translations as Parameters<typeof getLocalizedField>[0],
      locale,
      "description"
    ),
    address: event.address ?? "",
    ticketUrl: event.ticket_url,
    websiteUrl: event.website_url,
    specialGuest: event.special_guest,
    images: event.images ?? [],
    organizerName: event.organizer_name,
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
    .or(activeEventsOrFilter())
    .gte("starts_at", start.toISOString())
    .lte("starts_at", end.toISOString())
    .order("starts_at", { ascending: true });

  if (filters.genre) query = query.overlaps("genres", [filters.genre]);
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
    const item = mapEventToListItem(event, locale);
    if (isEventExpired(item)) continue;
    const dateKey = event.starts_at.split("T")[0];
    const items = byDate.get(dateKey) ?? [];
    items.push(item);
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
    .map((e) => mapEventToListItem(e, locale))
    .filter((event) => !isEventExpired(event));
}

export async function getBusinessEvents(
  businessAccountId: string,
  locale: Locale
): Promise<(EventListItem & { status: string; rejectionReason: string | null })[]> {
  if (shouldUseMockData()) return getMockBusinessEvents(locale);

  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("business_account_id", businessAccountId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const { getActivePromotionTargetIds } = await import(
    "@/lib/stripe/promotions"
  );
  const promotedIds = await getActivePromotionTargetIds(
    supabase,
    "event_boost",
    rows.map((event) => event.id)
  );

  const stalePromotedIds = rows
    .filter((event) => event.is_promoted && !promotedIds.has(event.id))
    .map((event) => event.id);

  if (stalePromotedIds.length > 0) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin
      .from("events")
      .update({ is_promoted: false, promotion_intensity: 1 })
      .in("id", stalePromotedIds);
  }

  return rows.map((event) => ({
    ...mapEventToListItem(
      stalePromotedIds.includes(event.id)
        ? { ...event, is_promoted: false, promotion_intensity: 1 }
        : promotedIds.has(event.id)
          ? { ...event, is_promoted: true, promotion_intensity: 3 }
          : event,
      locale
    ),
    status: event.status,
    rejectionReason: event.rejection_reason,
  }));
}

export async function getBusinessEventForEdit(
  id: string,
  businessAccountId: string,
  locale: Locale
): Promise<
  (CreateEventInput & {
    id: string;
    status: string;
    rejectionReason: string | null;
  }) | null
> {
  if (shouldUseMockData()) {
    const events = getMockBusinessEvents(locale);
    const event = events.find((e) => e.id === id);
    if (!event) return null;

    return {
      id: event.id,
      status: event.status,
      rejectionReason: event.rejectionReason,
      translations: { en: { title: event.title, description: "" } },
      startsAt: event.startsAt,
      endsAt: event.endsAt ?? undefined,
      genres: event.genres,
      genreOther: event.genreOther ?? undefined,
      eventType: event.eventType,
      price: event.price ?? undefined,
      priceOptions: event.priceOptions,
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
    rejectionReason: data.rejection_reason,
    translations,
    startsAt: data.starts_at,
    endsAt: data.ends_at ?? undefined,
    genres: normalizeGenres(data.genres),
    genreOther: data.genre_other ?? undefined,
    eventType: data.event_type as CreateEventInput["eventType"],
    price: data.price ?? undefined,
    priceOptions: parsePriceOptions(data.price_options),
    ticketUrl: data.ticket_url ?? undefined,
    websiteUrl: data.website_url ?? undefined,
    specialGuest: data.special_guest ?? undefined,
    organizerName: data.organizer_name ?? undefined,
    coverImageUrl: data.cover_image_url ?? undefined,
    images: data.images ?? [],
    venueName: data.venue_name ?? undefined,
    address: data.address ?? undefined,
    lat: data.lat ?? undefined,
    lng: data.lng ?? undefined,
  };
}

export type AdminPendingEvent = EventListItem & {
  status: string;
  rejectionReason: string | null;
};

export type AdminEventRow = EventListItem & {
  status: string;
  source: string;
  publishedAt: string | null;
};

export async function getPendingEventCount(): Promise<number> {
  if (shouldUseMockData()) return getMockPendingEvents("en").length;
  if (!isSupabaseConfigured()) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}

export async function getPendingEvents(
  locale: Locale,
  page = 1
): Promise<Paginated<AdminPendingEvent>> {
  if (shouldUseMockData()) {
    return paginateItems(getMockPendingEvents(locale), page);
  }

  if (!isSupabaseConfigured()) return emptyPage(page);

  const { from, to, pageSize, page: safePage } = rangeForPage(page);
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("events")
    .select("*", { count: "exact" })
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) throw error;

  return toPaginated(
    (data ?? []).map((e) => ({
      ...mapEventToListItem(e, locale),
      status: e.status,
      rejectionReason: e.rejection_reason,
    })),
    count ?? 0,
    safePage,
    pageSize
  );
}

function mockAllAdminEvents(locale: Locale): AdminEventRow[] {
  const pending = getMockPendingEvents(locale);
  const published = getMockEvents(locale, {}, true);
  const seen = new Set<string>();
  const merged = [...pending, ...published].filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
  return merged
    .map((e) => ({
      ...e,
      status: ("status" in e && typeof e.status === "string"
        ? e.status
        : "published") as string,
      source: "business",
      publishedAt: e.startsAt as string | null,
    }))
    .sort((a, b) => {
      if (a.isPromoted !== b.isPromoted) return a.isPromoted ? -1 : 1;
      const aPublished = a.publishedAt ?? "";
      const bPublished = b.publishedAt ?? "";
      if (aPublished !== bPublished) return bPublished.localeCompare(aPublished);
      return 0;
    });
}

export async function getAllAdminEvents(
  locale: Locale,
  options: { page?: number; q?: string; status?: string } = {}
): Promise<Paginated<AdminEventRow>> {
  const page = options.page ?? 1;
  const status = options.status && options.status !== "all" ? options.status : "";
  const pattern = options.q ? ilikeContains(options.q) : null;

  if (shouldUseMockData()) {
    const mapped = mockAllAdminEvents(locale).filter((e) => {
      const matchesStatus = !status || e.status === status;
      const matchesSearch =
        !options.q ||
        e.title.toLowerCase().includes(options.q.toLowerCase()) ||
        e.venueName.toLowerCase().includes(options.q.toLowerCase());
      return matchesStatus && matchesSearch;
    });
    return paginateItems(mapped, page);
  }

  if (!isSupabaseConfigured()) return emptyPage(page);

  const { from, to, pageSize, page: safePage } = rangeForPage(page);
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("*", { count: "exact" })
    .order("is_promoted", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (pattern) {
    query = query.or(
      `venue_name.ilike.${pattern},translations.ilike.${pattern}`
    );
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return toPaginated(
    (data ?? []).map((e) => ({
      ...mapEventToListItem(e, locale),
      status: e.status,
      source: e.source,
      publishedAt: e.published_at,
    })),
    count ?? 0,
    safePage,
    pageSize
  );
}

export async function getAdminEventForEdit(
  id: string,
  locale: Locale
): Promise<CreateEventInput & { id: string; status: string } | null> {
  if (shouldUseMockData()) {
    const event = mockAllAdminEvents(locale).find((e) => e.id === id);
    if (!event) return null;
    return {
      id: event.id,
      status: event.status,
      translations: {
        en: { title: event.title, description: "" },
      },
      startsAt: event.startsAt,
      endsAt: event.endsAt ?? undefined,
      genres: event.genres,
      genreOther: event.genreOther ?? undefined,
      eventType: event.eventType,
      price: event.price ?? undefined,
      priceOptions: event.priceOptions,
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
    genres: normalizeGenres(data.genres),
    genreOther: data.genre_other ?? undefined,
    eventType: data.event_type as CreateEventInput["eventType"],
    price: data.price ?? undefined,
    priceOptions: parsePriceOptions(data.price_options),
    ticketUrl: data.ticket_url ?? undefined,
    websiteUrl: data.website_url ?? undefined,
    specialGuest: data.special_guest ?? undefined,
    organizerName: data.organizer_name ?? undefined,
    coverImageUrl: data.cover_image_url ?? undefined,
    images: data.images ?? [],
    venueName: data.venue_name ?? undefined,
    address: data.address ?? undefined,
    lat: data.lat ?? undefined,
    lng: data.lng ?? undefined,
  };
}

export type AdminEventDetail = {
  id: string;
  slug: string;
  status: string;
  source: string;
  startsAt: string;
  endsAt: string | null;
  genres: EventListItem["genres"];
  genreOther: string | null;
  eventType: EventListItem["eventType"];
  price: number | null;
  priceOptions: EventListItem["priceOptions"];
  ticketUrl: string | null;
  websiteUrl: string | null;
  specialGuest: string | null;
  organizerName: string | null;
  coverImageUrl: string | null;
  images: string[];
  venueName: string;
  address: string;
  lat: number;
  lng: number;
  translations: CreateEventInput["translations"];
  businessAccountId: string | null;
  businessName: string | null;
  createdAt: string;
  rejectionReason: string | null;
};

function mapEventToAdminDetail(
  event: EventRow,
  businessName: string | null
): AdminEventDetail {
  const translations = event.translations as CreateEventInput["translations"];

  return {
    id: event.id,
    slug: event.slug,
    status: event.status,
    source: event.source,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    genres: normalizeGenres(event.genres),
    genreOther: event.genre_other,
    eventType: event.event_type as EventListItem["eventType"],
    price: event.price,
    priceOptions: parsePriceOptions(event.price_options),
    ticketUrl: event.ticket_url,
    websiteUrl: event.website_url,
    specialGuest: event.special_guest,
    organizerName: event.organizer_name,
    coverImageUrl: event.cover_image_url,
    images: event.images ?? [],
    venueName: event.venue_name ?? "",
    address: event.address ?? "",
    lat: event.lat,
    lng: event.lng,
    translations: {
      en: {
        title: translations?.en?.title ?? "",
        description: translations?.en?.description ?? "",
      },
      ...(translations?.ro
        ? {
            ro: {
              title: translations.ro.title,
              description: translations.ro.description,
            },
          }
        : {}),
    },
    businessAccountId: event.business_account_id,
    businessName,
    createdAt: event.created_at,
    rejectionReason: event.rejection_reason,
  };
}

async function getBusinessNameById(
  businessAccountId: string | null
): Promise<string | null> {
  if (!businessAccountId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("business_accounts")
    .select("name")
    .eq("id", businessAccountId)
    .maybeSingle();

  return data?.name ?? null;
}

export async function getAdminEventDetail(
  id: string
): Promise<AdminEventDetail | null> {
  if (shouldUseMockData()) {
    const row = getMockAdminEventRow(id);
    if (!row) return null;
    return mapEventToAdminDetail(
      row,
      row.business_account_id ? "Control Club" : null
    );
  }

  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const businessName = await getBusinessNameById(data.business_account_id);
  return mapEventToAdminDetail(data, businessName);
}
