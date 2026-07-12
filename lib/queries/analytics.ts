import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured, shouldUseMockData } from "@/lib/supabase/config";
import { getMockAdminAnalytics, getMockBusinessAnalytics } from "@/lib/mocks/data";

export type AnalyticsCounts = {
  views: number;
  saves: number;
  clicks: number;
  ticketClicks: number;
  shares: number;
};

export type BusinessAnalytics = AnalyticsCounts & {
  totalEvents: number;
  promotedEvents: number;
  activePromotions: number;
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

async function countAnalytics(
  entityType: "event" | "feed_post",
  entityIds?: string[]
): Promise<AnalyticsCounts> {
  const admin = createAdminClient();
  let query = admin.from("analytics_events").select("type");

  if (entityIds?.length) {
    query = query
      .eq("entity_type", entityType)
      .in("entity_id", entityIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  const counts: AnalyticsCounts = {
    views: 0,
    saves: 0,
    clicks: 0,
    ticketClicks: 0,
    shares: 0,
  };

  for (const row of data ?? []) {
    switch (row.type) {
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

  return counts;
}

const emptyAnalytics: AnalyticsCounts = {
  views: 0,
  saves: 0,
  clicks: 0,
  ticketClicks: 0,
  shares: 0,
};

export async function getBusinessAnalytics(
  businessAccountId: string
): Promise<BusinessAnalytics> {
  if (shouldUseMockData()) return getMockBusinessAnalytics();

  if (!isSupabaseConfigured()) {
    return { ...emptyAnalytics, totalEvents: 0, promotedEvents: 0, activePromotions: 0 };
  }

  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, is_promoted")
    .eq("business_account_id", businessAccountId);

  const eventIds = (events ?? []).map((e) => e.id);
  const analytics = await countAnalytics("event", eventIds);

  const { count: activePromotions } = await supabase
    .from("promotions")
    .select("*", { count: "exact", head: true })
    .eq("business_account_id", businessAccountId)
    .eq("is_active", true)
    .gte("expires_at", new Date().toISOString());

  return {
    ...analytics,
    totalEvents: events?.length ?? 0,
    promotedEvents: events?.filter((e) => e.is_promoted).length ?? 0,
    activePromotions: activePromotions ?? 0,
  };
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
