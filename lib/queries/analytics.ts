import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLocalizedField } from "@/lib/i18n/content";
import { isSupabaseAdminConfigured, isSupabaseConfigured, shouldUseMockData } from "@/lib/supabase/config";
import { getMockAdminAnalytics, getMockBusinessAnalytics } from "@/lib/mocks/data";
import type { Locale } from "@/types";

export type AnalyticsCounts = {
  views: number;
  saves: number;
  clicks: number;
  ticketClicks: number;
  shares: number;
};

export type EventAnalyticsRow = AnalyticsCounts & {
  id: string;
  title: string;
  startsAt: string;
  status: string;
  isPromoted: boolean;
};

export type BusinessAnalytics = AnalyticsCounts & {
  totalEvents: number;
  promotedEvents: number;
  activePromotions: number;
  events: EventAnalyticsRow[];
};

export type AdminAnalytics = {
  totalUsers: number;
  totalEvents: number;
  totalBusinesses: number;
  totalVenues: number;
  totalOrganizers: number;
  publishedEvents: number;
  pendingEvents: number;
  analytics: AnalyticsCounts;
  activePromotions: number;
  activeSubscriptions: number;
  totalRevenueCents: number;
  currency: string;
};

const emptyAnalytics: AnalyticsCounts = {
  views: 0,
  saves: 0,
  clicks: 0,
  ticketClicks: 0,
  shares: 0,
};

const emptyBusinessAnalytics: BusinessAnalytics = {
  ...emptyAnalytics,
  totalEvents: 0,
  promotedEvents: 0,
  activePromotions: 0,
  events: [],
};

function createEmptyCounts(): AnalyticsCounts {
  return { ...emptyAnalytics };
}

function incrementCount(counts: AnalyticsCounts, type: string) {
  switch (type) {
    case "view":
      counts.views++;
      break;
    case "save":
      counts.saves++;
      break;
    case "click":
      counts.clicks++;
      break;
    case "ticket_click":
      counts.ticketClicks++;
      break;
    case "share":
      counts.shares++;
      break;
  }
}

function sumAnalytics(rows: AnalyticsCounts[]): AnalyticsCounts {
  const totals = createEmptyCounts();
  for (const row of rows) {
    totals.views += row.views;
    totals.saves += row.saves;
    totals.clicks += row.clicks;
    totals.ticketClicks += row.ticketClicks;
    totals.shares += row.shares;
  }
  return totals;
}

async function countAnalytics(
  entityType: "event" | "feed_post",
  entityIds?: string[]
): Promise<AnalyticsCounts> {
  if (entityIds !== undefined && entityIds.length === 0) {
    return createEmptyCounts();
  }

  if (!isSupabaseAdminConfigured()) {
    return createEmptyCounts();
  }

  const admin = createAdminClient();
  let query = admin.from("analytics_events").select("type");

  if (entityIds?.length) {
    query = query
      .eq("entity_type", entityType)
      .in("entity_id", entityIds);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[analytics] countAnalytics failed:", error.message);
    return createEmptyCounts();
  }

  const counts = createEmptyCounts();
  for (const row of data ?? []) {
    incrementCount(counts, row.type);
  }

  return counts;
}

async function groupAnalyticsByEntity(
  entityType: "event" | "feed_post",
  entityIds: string[]
): Promise<Map<string, AnalyticsCounts>> {
  const byEntity = new Map<string, AnalyticsCounts>();
  for (const id of entityIds) {
    byEntity.set(id, createEmptyCounts());
  }

  if (entityIds.length === 0 || !isSupabaseAdminConfigured()) {
    return byEntity;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("analytics_events")
    .select("type, entity_id")
    .eq("entity_type", entityType)
    .in("entity_id", entityIds);

  if (error) {
    console.error("[analytics] groupAnalyticsByEntity failed:", error.message);
    return byEntity;
  }

  for (const row of data ?? []) {
    let counts = byEntity.get(row.entity_id);
    if (!counts) {
      counts = createEmptyCounts();
      byEntity.set(row.entity_id, counts);
    }
    incrementCount(counts, row.type);
  }

  return byEntity;
}

export async function getBusinessAnalytics(
  businessAccountId: string,
  locale: Locale = "en"
): Promise<BusinessAnalytics> {
  if (shouldUseMockData()) return getMockBusinessAnalytics(locale);

  if (!isSupabaseConfigured()) {
    return emptyBusinessAnalytics;
  }

  try {
    const supabase = await createClient();

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, is_promoted, status, starts_at, translations")
      .eq("business_account_id", businessAccountId);

    if (eventsError) {
      console.error(
        "[analytics] Failed to load business events:",
        eventsError.message
      );
      return emptyBusinessAnalytics;
    }

    const eventRows = events ?? [];
    const eventIds = eventRows.map((e) => e.id);
    const countsByEvent = await groupAnalyticsByEntity("event", eventIds);

    const eventAnalytics: EventAnalyticsRow[] = eventRows.map((event) => {
      const counts = countsByEvent.get(event.id) ?? createEmptyCounts();
      return {
        id: event.id,
        title: getLocalizedField(
          event.translations as Parameters<typeof getLocalizedField>[0],
          locale,
          "title"
        ),
        startsAt: event.starts_at,
        status: event.status,
        isPromoted: event.is_promoted,
        ...counts,
      };
    });

    eventAnalytics.sort((a, b) => {
      if (b.views !== a.views) return b.views - a.views;
      return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    });

    const analytics = sumAnalytics(eventAnalytics);

    const { count: activePromotions, error: promotionsError } = await supabase
      .from("promotions")
      .select("*", { count: "exact", head: true })
      .eq("business_account_id", businessAccountId)
      .eq("is_active", true)
      .gte("expires_at", new Date().toISOString());

    if (promotionsError) {
      console.error(
        "[analytics] Failed to load active promotions:",
        promotionsError.message
      );
    }

    return {
      ...analytics,
      totalEvents: eventRows.length,
      promotedEvents: eventRows.filter((e) => e.is_promoted).length,
      activePromotions: activePromotions ?? 0,
      events: eventAnalytics,
    };
  } catch (error) {
    console.error("[analytics] getBusinessAnalytics failed:", error);
    return emptyBusinessAnalytics;
  }
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  if (shouldUseMockData()) return getMockAdminAnalytics();

  if (!isSupabaseAdminConfigured()) {
    return {
      totalUsers: 0,
      totalEvents: 0,
      totalBusinesses: 0,
      totalVenues: 0,
      totalOrganizers: 0,
      publishedEvents: 0,
      pendingEvents: 0,
      analytics: emptyAnalytics,
      activePromotions: 0,
      activeSubscriptions: 0,
      totalRevenueCents: 0,
      currency: "eur",
    };
  }

  const admin = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalEvents },
    { count: totalBusinesses },
    { count: publishedEvents },
    { count: pendingEvents },
    { count: activePromotions },
    { count: activeSubscriptions },
    { data: businesses },
    { data: payments },
    analytics,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("events").select("*", { count: "exact", head: true }),
    admin.from("business_accounts").select("*", { count: "exact", head: true }),
    admin
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    admin
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("promotions")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    admin.from("business_accounts").select("type"),
    admin.from("payments").select("amount_cents, currency").eq("status", "paid"),
    countAnalytics("event"),
  ]);

  const totalRevenueCents = (payments ?? []).reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0
  );
  const currency = payments?.[0]?.currency ?? "eur";

  return {
    totalUsers: totalUsers ?? 0,
    totalEvents: totalEvents ?? 0,
    totalBusinesses: totalBusinesses ?? 0,
    totalVenues:
      businesses?.filter((b) => b.type === "venue").length ?? 0,
    totalOrganizers:
      businesses?.filter((b) => b.type === "organizer").length ?? 0,
    publishedEvents: publishedEvents ?? 0,
    pendingEvents: pendingEvents ?? 0,
    analytics,
    activePromotions: activePromotions ?? 0,
    activeSubscriptions: activeSubscriptions ?? 0,
    totalRevenueCents,
    currency,
  };
}
