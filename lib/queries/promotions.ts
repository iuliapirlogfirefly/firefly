import type { PromotionType } from "@/types";
import { SUBSCRIPTION_QUOTAS } from "@/lib/stripe/products";
import {
  isPaymentFailedStatus,
  isPremiumEntitled,
  parseBillingType,
  type BillingType,
} from "@/lib/stripe/entitlement";

export type AdminPromotionRow = {
  id: string;
  businessName: string;
  type: PromotionType;
  targetLabel: string;
  expiresAt: string;
  isActive: boolean;
};

export type AdminDeliveryRow = {
  id: string;
  businessName: string;
  type: Extract<PromotionType, "social_media" | "newsletter">;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  fulfilledAt: string | null;
  deliveryUrl: string | null;
  deliveryNotes: string | null;
};

const DELIVERY_TYPES = ["social_media", "newsletter"] as const;

export type AdminSubscriptionRow = {
  id: string;
  businessName: string;
  status: string;
  billingType: BillingType;
  renewsAt: string;
  cancelAtPeriodEnd: boolean;
  entitled: boolean;
  paymentFailed: boolean;
  promotedUsed: number;
  promotedQuota: number;
  postsUsed: number;
  postsQuota: number;
  newslettersUsed: number;
  newslettersQuota: number;
  socialUsed: number;
  socialQuota: number;
};

export type BusinessPromotionRow = {
  id: string;
  type: PromotionType;
  targetLabel: string;
  expiresAt: string;
  isActive: boolean;
};

export type BusinessSubscriptionInfo = {
  id: string;
  status: string;
  billingType: BillingType;
  renewsAt: string;
  cancelAtPeriodEnd: boolean;
  entitled: boolean;
  paymentFailed: boolean;
  canCancelRenewal: boolean;
  canManageBilling: boolean;
  promotedUsed: number;
  promotedQuota: number;
  postsUsed: number;
  postsQuota: number;
  newslettersUsed: number;
  newslettersQuota: number;
  socialUsed: number;
  socialQuota: number;
} | null;

export async function getBusinessPromotions(
  businessAccountId: string,
  locale: import("@/types").Locale = "en"
): Promise<BusinessPromotionRow[]> {
  const { shouldUseMockData, isSupabaseConfigured } = await import(
    "@/lib/supabase/config"
  );
  if (shouldUseMockData()) {
    const { getMockPromotions, MOCK_BUSINESS_ACCOUNT_ID } = await import(
      "@/lib/mocks/data"
    );
    if (businessAccountId !== MOCK_BUSINESS_ACCOUNT_ID) return [];

    return getMockPromotions()
      .filter((p) => p.venue === "Control Club" && p.status === "active")
      .map((p) => ({
        id: p.id,
        type: p.type as PromotionType,
        targetLabel: p.name,
        expiresAt: p.expiresAt,
        isActive: true,
      }));
  }

  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: promotions, error } = await supabase
    .from("promotions")
    .select("id, type, target_id, expires_at, is_active")
    .eq("business_account_id", businessAccountId)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true });

  if (error) throw error;

  const rows = promotions ?? [];
  const eventIds = rows
    .filter((p) => p.type === "event_boost")
    .map((p) => p.target_id);
  const postIds = rows
    .filter((p) => p.type === "feed_post")
    .map((p) => p.target_id);

  const [{ data: events }, { data: posts }] = await Promise.all([
    eventIds.length
      ? supabase.from("events").select("id, translations").in("id", eventIds)
      : Promise.resolve({ data: [] as { id: string; translations: unknown }[] }),
    postIds.length
      ? supabase
          .from("feed_posts")
          .select("id, translations")
          .in("id", postIds)
      : Promise.resolve({ data: [] as { id: string; translations: unknown }[] }),
  ]);

  const { getLocalizedField } = await import("@/lib/i18n/content");
  const eventMap = new Map(
    (events ?? []).map((e) => [
      e.id,
      getLocalizedField(
        e.translations as Parameters<typeof getLocalizedField>[0],
        locale,
        "title"
      ),
    ])
  );
  const postMap = new Map(
    (posts ?? []).map((p) => [
      p.id,
      getLocalizedField(
        p.translations as Parameters<typeof getLocalizedField>[0],
        locale,
        "title"
      ),
    ])
  );

  return rows.map((p) => ({
    id: p.id,
    type: p.type as PromotionType,
    targetLabel:
      p.type === "event_boost"
        ? (eventMap.get(p.target_id) ?? "Event")
        : p.type === "feed_post"
          ? (postMap.get(p.target_id) ?? "Feed post")
          : p.type === "newsletter"
            ? "Newsletter slot"
            : "Social media slot",
    expiresAt: p.expires_at?.slice(0, 10) ?? "",
    isActive: p.is_active,
  }));
}

export async function getBusinessSubscription(
  businessAccountId: string
): Promise<BusinessSubscriptionInfo> {
  const { shouldUseMockData, isSupabaseConfigured } = await import(
    "@/lib/supabase/config"
  );
  if (shouldUseMockData()) {
    const { MOCK_BUSINESS_ACCOUNT_ID } = await import("@/lib/mocks/data");
    if (businessAccountId !== MOCK_BUSINESS_ACCOUNT_ID) return null;

    return {
      id: "sub-1",
      status: "active",
      billingType: "recurring",
      renewsAt: "2026-04-15",
      cancelAtPeriodEnd: false,
      entitled: true,
      paymentFailed: false,
      canCancelRenewal: true,
      canManageBilling: true,
      promotedUsed: 2,
      promotedQuota: SUBSCRIPTION_QUOTAS.quota_promoted_events,
      postsUsed: 1,
      postsQuota: SUBSCRIPTION_QUOTAS.quota_feed_posts,
      newslettersUsed: 0,
      newslettersQuota: SUBSCRIPTION_QUOTAS.quota_newsletters,
      socialUsed: 0,
      socialQuota: SUBSCRIPTION_QUOTAS.quota_social_posts,
    };
  }

  if (!isSupabaseConfigured()) return null;

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: sub, error } = await supabase
    .from("subscriptions")
    .select(
      "id, status, billing_type, current_period_end, cancel_at_period_end, stripe_subscription_id, stripe_customer_id, used_promoted_events, quota_promoted_events, used_feed_posts, quota_feed_posts, used_newsletters, quota_newsletters, used_social_posts, quota_social_posts"
    )
    .eq("business_account_id", businessAccountId)
    .maybeSingle();

  if (error) throw error;
  if (!sub) return null;

  const entitled = isPremiumEntitled(sub);
  const paymentFailed = isPaymentFailedStatus(sub.status);
  if (!entitled && !paymentFailed) return null;

  const billingType = parseBillingType(sub.billing_type);

  return {
    id: sub.id,
    status: sub.status,
    billingType,
    renewsAt: sub.current_period_end?.slice(0, 10) ?? "",
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? billingType === "one_time",
    entitled,
    paymentFailed,
    canCancelRenewal:
      entitled &&
      billingType === "recurring" &&
      Boolean(sub.stripe_subscription_id) &&
      !sub.cancel_at_period_end,
    canManageBilling: Boolean(sub.stripe_customer_id),
    promotedUsed: sub.used_promoted_events,
    promotedQuota: sub.quota_promoted_events,
    postsUsed: sub.used_feed_posts,
    postsQuota: sub.quota_feed_posts,
    newslettersUsed: sub.used_newsletters,
    newslettersQuota: sub.quota_newsletters,
    socialUsed: sub.used_social_posts,
    socialQuota: sub.quota_social_posts,
  };
}

export async function getAdminPromotions(): Promise<AdminPromotionRow[]> {
  const { shouldUseMockData, isSupabaseConfigured } = await import(
    "@/lib/supabase/config"
  );
  if (shouldUseMockData()) {
    const { getMockPromotions } = await import("@/lib/mocks/data");
    return getMockPromotions().map((p) => ({
      id: p.id,
      businessName: p.venue,
      type: p.type as PromotionType,
      targetLabel: p.name,
      expiresAt: p.expiresAt,
      isActive: p.status === "active",
    }));
  }

  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [{ data: promotions, error }, { data: businesses }] = await Promise.all([
    supabase
      .from("promotions")
      .select("id, type, target_id, expires_at, is_active, business_account_id")
      .eq("is_active", true)
      .order("expires_at", { ascending: true }),
    supabase.from("business_accounts").select("id, name"),
  ]);

  if (error) throw error;

  const businessMap = new Map(
    (businesses ?? []).map((b) => [b.id, b.name])
  );

  return (promotions ?? []).map((p) => ({
    id: p.id,
    businessName: businessMap.get(p.business_account_id) ?? "Unknown",
    type: p.type as PromotionType,
    targetLabel: p.target_id?.slice(0, 8) ?? "—",
    expiresAt: p.expires_at?.slice(0, 10) ?? "",
    isActive: p.is_active,
  }));
}

export async function getAdminSubscriptions(): Promise<AdminSubscriptionRow[]> {
  const { shouldUseMockData, isSupabaseConfigured } = await import(
    "@/lib/supabase/config"
  );
  if (shouldUseMockData()) {
    return [
      {
        id: "sub-1",
        businessName: "Control Club",
        status: "active",
        billingType: "recurring",
        renewsAt: "2026-04-15",
        cancelAtPeriodEnd: false,
        entitled: true,
        paymentFailed: false,
        promotedUsed: 2,
        promotedQuota: 4,
        postsUsed: 1,
        postsQuota: 4,
        newslettersUsed: 0,
        newslettersQuota: 1,
        socialUsed: 0,
        socialQuota: 2,
      },
    ];
  }

  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [{ data: subscriptions, error }, { data: businesses }] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select(
          "id, status, billing_type, current_period_end, cancel_at_period_end, used_promoted_events, quota_promoted_events, used_feed_posts, quota_feed_posts, used_newsletters, quota_newsletters, used_social_posts, quota_social_posts, business_account_id"
        ),
      supabase.from("business_accounts").select("id, name"),
    ]);

  if (error) throw error;

  const businessMap = new Map(
    (businesses ?? []).map((b) => [b.id, b.name])
  );

  return (subscriptions ?? []).map((s) => ({
    id: s.id,
    businessName: businessMap.get(s.business_account_id) ?? "Unknown",
    status: s.status,
    billingType: parseBillingType(s.billing_type),
    renewsAt: s.current_period_end?.slice(0, 10) ?? "",
    cancelAtPeriodEnd: s.cancel_at_period_end ?? false,
    entitled: isPremiumEntitled(s),
    paymentFailed: isPaymentFailedStatus(s.status),
    promotedUsed: s.used_promoted_events,
    promotedQuota: s.quota_promoted_events,
    postsUsed: s.used_feed_posts,
    postsQuota: s.quota_feed_posts,
    newslettersUsed: s.used_newsletters,
    newslettersQuota: s.quota_newsletters,
    socialUsed: s.used_social_posts,
    socialQuota: s.quota_social_posts,
  })).filter((s) => s.entitled || s.paymentFailed);
}

function sortDeliveries(rows: AdminDeliveryRow[]): AdminDeliveryRow[] {
  return [...rows].sort((a, b) => {
    const aPending = a.fulfilledAt ? 1 : 0;
    const bPending = b.fulfilledAt ? 1 : 0;
    if (aPending !== bPending) return aPending - bPending;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function getAdminDeliveries(): Promise<AdminDeliveryRow[]> {
  const { shouldUseMockData, isSupabaseConfigured } = await import(
    "@/lib/supabase/config"
  );
  if (shouldUseMockData()) {
    const { getMockPromotions } = await import("@/lib/mocks/data");
    return sortDeliveries(
      getMockPromotions()
        .filter(
          (p): p is (typeof p) & {
            type: "social_media" | "newsletter";
          } =>
            p.type === "social_media" || p.type === "newsletter"
        )
        .map((p) => ({
          id: p.id,
          businessName: p.venue,
          type: p.type,
          createdAt: p.createdAt,
          expiresAt: p.expiresAt,
          isActive: p.status === "active" || p.status === "scheduled",
          fulfilledAt: p.fulfilledAt,
          deliveryUrl: p.deliveryUrl,
          deliveryNotes: p.deliveryNotes,
        }))
    );
  }

  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [{ data: promotions, error }, { data: businesses }] = await Promise.all([
    supabase
      .from("promotions")
      .select(
        "id, type, expires_at, is_active, created_at, business_account_id, fulfilled_at, delivery_url, delivery_notes"
      )
      .in("type", [...DELIVERY_TYPES])
      .order("created_at", { ascending: false }),
    supabase.from("business_accounts").select("id, name"),
  ]);

  if (error) throw error;

  const businessMap = new Map(
    (businesses ?? []).map((b) => [b.id, b.name])
  );

  return sortDeliveries(
    (promotions ?? []).map((p) => ({
      id: p.id,
      businessName: businessMap.get(p.business_account_id) ?? "Unknown",
      type: p.type as AdminDeliveryRow["type"],
      createdAt: p.created_at,
      expiresAt: p.expires_at?.slice(0, 10) ?? "",
      isActive: p.is_active,
      fulfilledAt: p.fulfilled_at,
      deliveryUrl: p.delivery_url,
      deliveryNotes: p.delivery_notes,
    }))
  );
}

export async function getPendingDeliveryCount(): Promise<number> {
  const { shouldUseMockData, isSupabaseConfigured } = await import(
    "@/lib/supabase/config"
  );
  if (shouldUseMockData()) {
    const { getMockPromotions } = await import("@/lib/mocks/data");
    return getMockPromotions().filter(
      (p) =>
        (p.type === "social_media" || p.type === "newsletter") &&
        !p.fulfilledAt
    ).length;
  }

  if (!isSupabaseConfigured()) return 0;

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("promotions")
    .select("id", { count: "exact", head: true })
    .in("type", [...DELIVERY_TYPES])
    .is("fulfilled_at", null);

  if (error) throw error;
  return count ?? 0;
}
