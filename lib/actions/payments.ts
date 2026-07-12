"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { getStripe } from "@/lib/stripe/client";
import { PROMOTION_PRICES } from "@/lib/stripe/products";
import { activatePromotion } from "@/lib/stripe/activate-promotion";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult, PromotionType } from "@/types";

const QUOTA_MAP: Record<
  PromotionType,
  { quota: keyof SubscriptionRow; used: keyof SubscriptionRow }
> = {
  event_boost: {
    quota: "quota_promoted_events",
    used: "used_promoted_events",
  },
  feed_post: { quota: "quota_feed_posts", used: "used_feed_posts" },
  newsletter: { quota: "quota_newsletters", used: "used_newsletters" },
  social_media: { quota: "quota_social_posts", used: "used_social_posts" },
};

type SubscriptionRow = {
  id: string;
  quota_promoted_events: number;
  used_promoted_events: number;
  quota_feed_posts: number;
  used_feed_posts: number;
  quota_newsletters: number;
  used_newsletters: number;
  quota_social_posts: number;
  used_social_posts: number;
};

const TARGET_REQUIRED_TYPES: PromotionType[] = ["event_boost", "feed_post"];

async function validatePromotionTarget(
  businessAccountId: string,
  type: PromotionType,
  targetId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  if (type === "event_boost") {
    const { data } = await supabase
      .from("events")
      .select("id")
      .eq("id", targetId)
      .eq("business_account_id", businessAccountId)
      .eq("status", "published")
      .maybeSingle();

    if (!data) return failure("Published event not found");
    return success(undefined);
  }

  if (type === "feed_post") {
    const { data } = await supabase
      .from("feed_posts")
      .select("id")
      .eq("id", targetId)
      .eq("business_account_id", businessAccountId)
      .eq("status", "published")
      .maybeSingle();

    if (!data) return failure("Published feed post not found");
    return success(undefined);
  }

  return success(undefined);
}

async function getActiveSubscription(
  businessAccountId: string
): Promise<SubscriptionRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select(
      "id, quota_promoted_events, used_promoted_events, quota_feed_posts, used_feed_posts, quota_newsletters, used_newsletters, quota_social_posts, used_social_posts"
    )
    .eq("business_account_id", businessAccountId)
    .eq("status", "active")
    .maybeSingle();

  return data;
}

function hasQuotaRemaining(sub: SubscriptionRow, type: PromotionType): boolean {
  const mapping = QUOTA_MAP[type];
  const quota = sub[mapping.quota] as number;
  const used = sub[mapping.used] as number;
  return used < quota;
}

export async function createCheckoutSession(
  type: PromotionType,
  targetId?: string
): Promise<ActionResult<{ url: string }>> {
  const disabled = supabaseDisabled<{ url: string }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const price = PROMOTION_PRICES[type];
    if (!price) return failure("Invalid promotion type");

    const resolvedTargetId =
      targetId ??
      (TARGET_REQUIRED_TYPES.includes(type)
        ? undefined
        : session.businessAccountId);

    if (TARGET_REQUIRED_TYPES.includes(type) && !resolvedTargetId) {
      return failure("Target selection required");
    }

    if (resolvedTargetId) {
      const validation = await validatePromotionTarget(
        session.businessAccountId,
        type,
        resolvedTargetId
      );
      if (!validation.success) return validation as ActionResult<{ url: string }>;
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const locale = session.preferredLocale ?? "en";
    const promotionsPath = `${appUrl}/${locale}/business/promotions`;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: price.currency,
            unit_amount: price.amount,
            product_data: { name: price.label },
          },
          quantity: 1,
        },
      ],
      metadata: {
        business_account_id: session.businessAccountId,
        promotion_type: type,
        target_id: resolvedTargetId ?? "",
      },
      success_url: `${promotionsPath}?success=true`,
      cancel_url: `${promotionsPath}?canceled=true`,
    });

    if (!checkoutSession.url) return failure("Failed to create checkout session");
    return success({ url: checkoutSession.url });
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to create checkout session"
    );
  }
}

export async function createSubscriptionCheckout(): Promise<
  ActionResult<{ url: string }>
> {
  const disabled = supabaseDisabled<{ url: string }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const priceId = process.env.STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID;
    if (!priceId) return failure("Subscription price not configured");

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const locale = session.preferredLocale ?? "en";
    const promotionsPath = `${appUrl}/${locale}/business/promotions`;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        business_account_id: session.businessAccountId,
      },
      subscription_data: {
        metadata: {
          business_account_id: session.businessAccountId,
        },
      },
      success_url: `${promotionsPath}?subscription=success`,
      cancel_url: `${promotionsPath}?canceled=true`,
    });

    if (!checkoutSession.url) return failure("Failed to create checkout session");
    return success({ url: checkoutSession.url });
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to create subscription checkout"
    );
  }
}

export async function useSubscriptionQuota(
  type: PromotionType,
  targetId?: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const resolvedTargetId =
      targetId ??
      (TARGET_REQUIRED_TYPES.includes(type)
        ? undefined
        : session.businessAccountId);

    if (TARGET_REQUIRED_TYPES.includes(type) && !resolvedTargetId) {
      return failure("Target selection required");
    }

    if (resolvedTargetId) {
      const validation = await validatePromotionTarget(
        session.businessAccountId,
        type,
        resolvedTargetId
      );
      if (!validation.success) return validation;
    }

    const supabase = await createClient();
    const sub = await getActiveSubscription(session.businessAccountId);

    if (!sub) return failure("No active subscription");

    const mapping = QUOTA_MAP[type];
    const quota = sub[mapping.quota] as number;
    const used = sub[mapping.used] as number;

    if (used >= quota) return failure("Subscription quota exceeded");

    const updatePayload =
      type === "event_boost"
        ? { used_promoted_events: used + 1 }
        : type === "feed_post"
          ? { used_feed_posts: used + 1 }
          : type === "newsletter"
            ? { used_newsletters: used + 1 }
            : { used_social_posts: used + 1 };

    const { error } = await supabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("id", sub.id);

    if (error) return failure(error.message);

    const admin = createAdminClient();
    await activatePromotion(admin, {
      businessAccountId: session.businessAccountId,
      type,
      targetId: resolvedTargetId!,
      stripePaymentId: null,
    });

    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to use subscription quota"
    );
  }
}

export async function purchasePromotion(
  type: PromotionType,
  targetId?: string,
  options?: { forceCheckout?: boolean }
): Promise<ActionResult<{ url?: string; usedQuota?: boolean }>> {
  const disabled = supabaseDisabled<{ url?: string; usedQuota?: boolean }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const resolvedTargetId =
      targetId ??
      (TARGET_REQUIRED_TYPES.includes(type)
        ? undefined
        : session.businessAccountId);

    if (TARGET_REQUIRED_TYPES.includes(type) && !resolvedTargetId) {
      return failure("Target selection required");
    }

    if (!options?.forceCheckout) {
      const sub = await getActiveSubscription(session.businessAccountId);
      if (sub && hasQuotaRemaining(sub, type)) {
        const quotaResult = await useSubscriptionQuota(type, resolvedTargetId);
        if (quotaResult.success) {
          return success({ usedQuota: true });
        }
        return quotaResult as ActionResult<{ url?: string; usedQuota?: boolean }>;
      }
    }

    const checkout = await createCheckoutSession(type, resolvedTargetId);
    if (!checkout.success) return checkout;
    return success({ url: checkout.data.url });
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to purchase promotion"
    );
  }
}
