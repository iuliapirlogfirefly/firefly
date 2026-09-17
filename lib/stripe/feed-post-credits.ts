import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, shouldUseMockData } from "@/lib/supabase/config";
import { isPremiumEntitled } from "@/lib/stripe/entitlement";
import { FEED_POST_PACK_SIZE } from "@/lib/stripe/products";
import type { Database, Json } from "@/types/database.types";

type AdminClient = SupabaseClient<Database>;

export type FeedPostCreditSource = "premium" | "addon";

export type FeedPostCreditBalance = {
  premiumUsed: number;
  premiumQuota: number;
  packUsed: number;
  packQuota: number;
  remaining: number;
};

function emptyBalance(): FeedPostCreditBalance {
  return {
    premiumUsed: 0,
    premiumQuota: 0,
    packUsed: 0,
    packQuota: 0,
    remaining: 0,
  };
}

function parseCreditSource(value: string | null): FeedPostCreditSource | null {
  if (value === "premium" || value === "addon") return value;
  return null;
}

export async function consumeFeedPostCredit(
  admin: AdminClient,
  businessAccountId: string
): Promise<FeedPostCreditSource | null> {
  const { data, error } = await admin.rpc("consume_feed_post_credit", {
    p_business_id: businessAccountId,
  });
  if (error) throw error;
  return parseCreditSource(data);
}

export async function restoreFeedPostCredit(
  admin: AdminClient,
  businessAccountId: string
): Promise<FeedPostCreditSource | null> {
  const { data, error } = await admin.rpc("restore_feed_post_credit", {
    p_business_id: businessAccountId,
  });
  if (error) throw error;
  return parseCreditSource(data);
}

export async function grantFeedPostPack(
  admin: AdminClient,
  businessAccountId: string,
  count = FEED_POST_PACK_SIZE
): Promise<void> {
  const { error } = await admin.rpc("grant_feed_post_pack", {
    p_business_id: businessAccountId,
    p_count: count,
  });
  if (error) throw error;
}

export async function grantFeedPostPackFromPayment(
  admin: AdminClient,
  businessAccountId: string,
  paymentIntentId: string | null
): Promise<void> {
  if (paymentIntentId) {
    const { data: payment } = await admin
      .from("payments")
      .select("id, metadata")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .maybeSingle();

    const raw = payment?.metadata;
    const metadata =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, Json | undefined>)
        : {};
    if (metadata.feed_post_pack_granted === "true") return;

    await grantFeedPostPack(admin, businessAccountId);

    if (payment?.id) {
      await admin
        .from("payments")
        .update({
          metadata: { ...metadata, feed_post_pack_granted: "true" },
        })
        .eq("id", payment.id);
    }
    return;
  }

  await grantFeedPostPack(admin, businessAccountId);
}

export async function getFeedPostCreditBalance(
  businessAccountId: string
): Promise<FeedPostCreditBalance> {
  if (shouldUseMockData()) {
    return {
      premiumUsed: 1,
      premiumQuota: 4,
      packUsed: 0,
      packQuota: FEED_POST_PACK_SIZE,
      remaining: 7,
    };
  }

  if (!isSupabaseConfigured()) return emptyBalance();

  const supabase = await createClient();
  const [{ data: business }, { data: sub }] = await Promise.all([
    supabase
      .from("business_accounts")
      .select("addon_feed_posts_quota, addon_feed_posts_used")
      .eq("id", businessAccountId)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, current_period_end, quota_feed_posts, used_feed_posts")
      .eq("business_account_id", businessAccountId)
      .maybeSingle(),
  ]);

  const entitled = isPremiumEntitled(sub);
  const premiumUsed = entitled ? (sub?.used_feed_posts ?? 0) : 0;
  const premiumQuota = entitled ? (sub?.quota_feed_posts ?? 0) : 0;
  const packUsed = business?.addon_feed_posts_used ?? 0;
  const packQuota = business?.addon_feed_posts_quota ?? 0;

  return {
    premiumUsed,
    premiumQuota,
    packUsed,
    packQuota,
    remaining:
      Math.max(0, premiumQuota - premiumUsed) + Math.max(0, packQuota - packUsed),
  };
}
