import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLocalizedField } from "@/lib/i18n/content";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
  shouldUseMockData,
} from "@/lib/supabase/config";
import {
  getMockAdminAnalytics,
  getMockBusinessAnalytics,
} from "@/lib/mocks/data";
import { PROMOTION_PRICES, SUBSCRIPTION_PRICE } from "@/lib/stripe/products";
import { getMonthWindows, percentChange } from "@/lib/utils/percent-change";
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

export type MetricDeltas = {
  totalUsers: number | null;
  totalEvents: number | null;
  totalBusinesses: number | null;
  totalRevenueCents: number | null;
  views: number | null;
  saves: number | null;
  clicks: number | null;
  ticketClicks: number | null;
  shares: number | null;
};

export type RevenueBreakdownItem = {
  key: string;
  label: string;
  amountCents: number;
};

export type BusinessMetricDeltas = {
  totalEvents: number | null;
  views: number | null;
  saves: number | null;
  clicks: number | null;
  ticketClicks: number | null;
  shares: number | null;
};

export type BusinessAnalytics = AnalyticsCounts & {
  totalEvents: number;
  promotedEvents: number;
  activePromotions: number;
  events: EventAnalyticsRow[];
  deltas: BusinessMetricDeltas;
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
  revenueBreakdown: RevenueBreakdownItem[];
  deltas: MetricDeltas;
};

export type EngagementMetric =
  | "views"
  | "saves"
  | "clicks"
  | "ticketClicks"
  | "shares";

const emptyAnalytics: AnalyticsCounts = {
  views: 0,
  saves: 0,
  clicks: 0,
  ticketClicks: 0,
  shares: 0,
};

const emptyDeltas: MetricDeltas = {
  totalUsers: null,
  totalEvents: null,
  totalBusinesses: null,
  totalRevenueCents: null,
  views: null,
  saves: null,
  clicks: null,
  ticketClicks: null,
  shares: null,
};

const emptyBusinessDeltas: BusinessMetricDeltas = {
  totalEvents: null,
  views: null,
  saves: null,
  clicks: null,
  ticketClicks: null,
  shares: null,
};

const emptyBusinessAnalytics: BusinessAnalytics = {
  ...emptyAnalytics,
  totalEvents: 0,
  promotedEvents: 0,
  activePromotions: 0,
  events: [],
  deltas: emptyBusinessDeltas,
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

function productLabel(productType: string): string {
  if (productType === "subscription" || productType === "premium_monthly") {
    return SUBSCRIPTION_PRICE.label;
  }
  const promo =
    PROMOTION_PRICES[productType as keyof typeof PROMOTION_PRICES];
  return promo?.label ?? productType.replace(/_/g, " ");
}

function buildRevenueBreakdown(
  payments: { type: string; product_type: string; amount_cents: number }[]
): RevenueBreakdownItem[] {
  const byKey = new Map<string, number>();

  for (const row of payments) {
    const key =
      row.type === "subscription" ? "subscription" : row.product_type;
    byKey.set(key, (byKey.get(key) ?? 0) + (row.amount_cents ?? 0));
  }

  const order = [
    "subscription",
    "event_boost",
    "feed_post",
    "newsletter",
    "social_media",
  ];

  const items: RevenueBreakdownItem[] = [];
  for (const key of order) {
    const amount = byKey.get(key);
    if (amount && amount > 0) {
      items.push({ key, label: productLabel(key), amountCents: amount });
      byKey.delete(key);
    }
  }
  for (const [key, amountCents] of byKey) {
    if (amountCents > 0) {
      items.push({ key, label: productLabel(key), amountCents });
    }
  }
  return items;
}

async function countAnalytics(
  entityType: "event" | "feed_post",
  entityIds?: string[],
  range?: { start: string; end: string }
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
    query = query.eq("entity_type", entityType).in("entity_id", entityIds);
  } else if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  if (range) {
    query = query.gte("created_at", range.start).lt("created_at", range.end);
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

async function countRowsInRange(
  table: "profiles" | "events" | "business_accounts",
  range: { start: string; end: string }
): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;
  const admin = createAdminClient();
  const { count, error } = await admin
    .from(table)
    .select("*", { count: "exact", head: true })
    .gte("created_at", range.start)
    .lt("created_at", range.end);
  if (error) {
    console.error(`[analytics] count ${table} failed:`, error.message);
    return 0;
  }
  return count ?? 0;
}

async function sumRevenueInRange(range: {
  start: string;
  end: string;
}): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select("amount_cents")
    .eq("status", "paid")
    .gte("paid_at", range.start)
    .lt("paid_at", range.end);
  if (error) {
    console.error("[analytics] revenue range failed:", error.message);
    return 0;
  }
  return (data ?? []).reduce((sum, row) => sum + (row.amount_cents ?? 0), 0);
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

async function countAnalyticsInRangeForEntities(
  entityIds: string[],
  range: { start: string; end: string }
): Promise<AnalyticsCounts> {
  if (entityIds.length === 0 || !isSupabaseAdminConfigured()) {
    return createEmptyCounts();
  }
  return countAnalytics("event", entityIds, range);
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
    const { current, previous } = getMonthWindows();

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, is_promoted, status, starts_at, translations, created_at")
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

    const eventsThisMonth = eventRows.filter(
      (e) => e.created_at >= current.start && e.created_at < current.end
    ).length;
    const eventsPrevMonth = eventRows.filter(
      (e) => e.created_at >= previous.start && e.created_at < previous.end
    ).length;

    const [engagementCurrent, engagementPrevious] = await Promise.all([
      countAnalyticsInRangeForEntities(eventIds, current),
      countAnalyticsInRangeForEntities(eventIds, previous),
    ]);

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
      deltas: {
        totalEvents: percentChange(eventsThisMonth, eventsPrevMonth),
        views: percentChange(engagementCurrent.views, engagementPrevious.views),
        saves: percentChange(engagementCurrent.saves, engagementPrevious.saves),
        clicks: percentChange(
          engagementCurrent.clicks,
          engagementPrevious.clicks
        ),
        ticketClicks: percentChange(
          engagementCurrent.ticketClicks,
          engagementPrevious.ticketClicks
        ),
        shares: percentChange(
          engagementCurrent.shares,
          engagementPrevious.shares
        ),
      },
    };
  } catch (error) {
    console.error("[analytics] getBusinessAnalytics failed:", error);
    return emptyBusinessAnalytics;
  }
}

export async function getAdminEventAnalytics(
  locale: Locale = "en",
  sortBy: EngagementMetric = "views"
): Promise<EventAnalyticsRow[]> {
  if (shouldUseMockData()) {
    const mock = getMockBusinessAnalytics(locale);
    return [...mock.events].sort(
      (a, b) => (b[sortBy] as number) - (a[sortBy] as number)
    );
  }

  if (!isSupabaseAdminConfigured()) return [];

  const admin = createAdminClient();
  const { data: events, error } = await admin
    .from("events")
    .select("id, is_promoted, status, starts_at, translations")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !events) {
    console.error("[analytics] getAdminEventAnalytics failed:", error?.message);
    return [];
  }

  const countsByEvent = await groupAnalyticsByEntity(
    "event",
    events.map((e) => e.id)
  );

  const rows: EventAnalyticsRow[] = events.map((event) => {
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

  rows.sort((a, b) => {
    const diff = (b[sortBy] as number) - (a[sortBy] as number);
    if (diff !== 0) return diff;
    return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
  });

  return rows;
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
      revenueBreakdown: [],
      deltas: emptyDeltas,
    };
  }

  const admin = createAdminClient();
  const { current, previous } = getMonthWindows();

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
    usersCurrent,
    usersPrevious,
    eventsCurrent,
    eventsPrevious,
    businessesCurrent,
    businessesPrevious,
    revenueCurrent,
    revenuePrevious,
    engagementCurrent,
    engagementPrevious,
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
    admin
      .from("payments")
      .select("amount_cents, currency, type, product_type")
      .eq("status", "paid"),
    countAnalytics("event"),
    countRowsInRange("profiles", current),
    countRowsInRange("profiles", previous),
    countRowsInRange("events", current),
    countRowsInRange("events", previous),
    countRowsInRange("business_accounts", current),
    countRowsInRange("business_accounts", previous),
    sumRevenueInRange(current),
    sumRevenueInRange(previous),
    countAnalytics("event", undefined, current),
    countAnalytics("event", undefined, previous),
  ]);

  const paymentRows = payments ?? [];
  const totalRevenueCents = paymentRows.reduce(
    (sum, row) => sum + (row.amount_cents ?? 0),
    0
  );
  const currency = paymentRows[0]?.currency ?? "eur";

  return {
    totalUsers: totalUsers ?? 0,
    totalEvents: totalEvents ?? 0,
    totalBusinesses: totalBusinesses ?? 0,
    totalVenues: businesses?.filter((b) => b.type === "venue").length ?? 0,
    totalOrganizers:
      businesses?.filter((b) => b.type === "organizer").length ?? 0,
    publishedEvents: publishedEvents ?? 0,
    pendingEvents: pendingEvents ?? 0,
    analytics,
    activePromotions: activePromotions ?? 0,
    activeSubscriptions: activeSubscriptions ?? 0,
    totalRevenueCents,
    currency,
    revenueBreakdown: buildRevenueBreakdown(paymentRows),
    deltas: {
      totalUsers: percentChange(usersCurrent, usersPrevious),
      totalEvents: percentChange(eventsCurrent, eventsPrevious),
      totalBusinesses: percentChange(businessesCurrent, businessesPrevious),
      totalRevenueCents: percentChange(revenueCurrent, revenuePrevious),
      views: percentChange(engagementCurrent.views, engagementPrevious.views),
      saves: percentChange(engagementCurrent.saves, engagementPrevious.saves),
      clicks: percentChange(
        engagementCurrent.clicks,
        engagementPrevious.clicks
      ),
      ticketClicks: percentChange(
        engagementCurrent.ticketClicks,
        engagementPrevious.ticketClicks
      ),
      shares: percentChange(
        engagementCurrent.shares,
        engagementPrevious.shares
      ),
    },
  };
}
