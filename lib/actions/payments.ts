"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { getStripe } from "@/lib/stripe/client";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
import {
  hasBlockingPremium,
  isPremiumEntitled,
} from "@/lib/stripe/entitlement";
import { PREMIUM_PRODUCT, PROMOTION_PRICES, SUBSCRIPTION_PRICE } from "@/lib/stripe/products";
import { activatePromotion } from "@/lib/stripe/activate-promotion";
import { hasActivePromotion } from "@/lib/stripe/promotions";
import { isPrelaunchActive } from "@/lib/launch/settings";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult, PromotionType } from "@/types";
import type Stripe from "stripe";

const PROMOTIONS_LOCKED_MESSAGE =
  "Promotions unlock when Firefly launches.";

async function rejectIfPromotionsLocked<T = void>(): Promise<ActionResult<T> | null> {
  if (await isPrelaunchActive()) {
    return failure(PROMOTIONS_LOCKED_MESSAGE);
  }
  return null;
}

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
  status: string;
  current_period_end: string;
  quota_promoted_events: number;
  used_promoted_events: number;
  quota_feed_posts: number;
  used_feed_posts: number;
  quota_newsletters: number;
  used_newsletters: number;
  quota_social_posts: number;
  used_social_posts: number;
};

const SUBSCRIPTION_SELECT =
  "id, status, current_period_end, quota_promoted_events, used_promoted_events, quota_feed_posts, used_feed_posts, quota_newsletters, used_newsletters, quota_social_posts, used_social_posts";

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
  } else if (type === "feed_post") {
    const { data } = await supabase
      .from("feed_posts")
      .select("id")
      .eq("id", targetId)
      .eq("business_account_id", businessAccountId)
      .eq("status", "published")
      .maybeSingle();

    if (!data) return failure("Published feed post not found");
  } else {
    return success(undefined);
  }

  if (await hasActivePromotion(supabase, type, targetId)) {
    return failure("This item is already boosted until it expires");
  }

  return success(undefined);
}

async function getActiveSubscription(
  businessAccountId: string
): Promise<SubscriptionRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select(SUBSCRIPTION_SELECT)
    .eq("business_account_id", businessAccountId)
    .maybeSingle();

  if (!data || !isPremiumEntitled(data)) return null;
  return data;
}

function checkoutLocale(
  locale: string
): Stripe.Checkout.SessionCreateParams.Locale {
  return locale === "ro" ? "ro" : "en";
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
  const locked = await rejectIfPromotionsLocked<{ url: string }>();
  if (locked) return locked;

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

export async function createSubscriptionCheckout(options: {
  autoRenew: boolean;
  acceptedTerms: boolean;
}): Promise<ActionResult<{ url: string }>> {
  const disabled = supabaseDisabled<{ url: string }>();
  if (disabled) return disabled;
  const locked = await rejectIfPromotionsLocked<{ url: string }>();
  if (locked) return locked;

  try {
    if (!options.acceptedTerms) {
      return failure("You must accept the Terms and Privacy Policy");
    }

    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("business_account_id", session.businessAccountId)
      .maybeSingle();

    if (hasBlockingPremium(existing)) {
      return failure("A Premium subscription is already active or pending payment");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const locale = session.preferredLocale ?? "en";
    const promotionsPath = `${appUrl}/${locale}/business/promotions`;
    const customerId = await getOrCreateStripeCustomer({
      businessAccountId: session.businessAccountId,
      email: session.email,
    });

    const acceptedAt = new Date().toISOString();
    const metadata = {
      business_account_id: session.businessAccountId,
      product: PREMIUM_PRODUCT,
      auto_renew: options.autoRenew ? "true" : "false",
      accepted_terms: "true",
      terms_accepted_at: acceptedAt,
    };

    const checkoutSession = options.autoRenew
      ? await createRecurringCheckout({
          customerId,
          locale,
          promotionsPath,
          metadata,
        })
      : await createOneTimeCheckout({
          customerId,
          locale,
          promotionsPath,
          metadata,
        });

    if (!checkoutSession.url) return failure("Failed to create checkout session");
    return success({ url: checkoutSession.url });
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to create subscription checkout"
    );
  }
}

async function createRecurringCheckout(params: {
  customerId: string;
  locale: string;
  promotionsPath: string;
  metadata: Record<string, string>;
}) {
  const priceId = process.env.STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID?.trim();
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [
        {
          price_data: {
            currency: SUBSCRIPTION_PRICE.currency,
            unit_amount: SUBSCRIPTION_PRICE.amount,
            recurring: { interval: "month" },
            product_data: {
              name: SUBSCRIPTION_PRICE.label,
            },
          },
          quantity: 1,
        },
      ];

  return getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: params.customerId,
    customer_update: { address: "auto", name: "auto" },
    locale: checkoutLocale(params.locale),
    line_items: lineItems,
    metadata: params.metadata,
    subscription_data: {
      metadata: params.metadata,
    },
    success_url: `${params.promotionsPath}?subscription=success`,
    cancel_url: `${params.promotionsPath}?canceled=true`,
  });
}

async function createOneTimeCheckout(params: {
  customerId: string;
  locale: string;
  promotionsPath: string;
  metadata: Record<string, string>;
}) {
  const oneTimePriceId = process.env.STRIPE_PREMIUM_ONETIME_PRICE_ID;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = oneTimePriceId
    ? [{ price: oneTimePriceId, quantity: 1 }]
    : [
        {
          price_data: {
            currency: SUBSCRIPTION_PRICE.currency,
            unit_amount: SUBSCRIPTION_PRICE.amount,
            product_data: {
              name: `${SUBSCRIPTION_PRICE.label} (one month)`,
            },
          },
          quantity: 1,
        },
      ];

  return getStripe().checkout.sessions.create({
    mode: "payment",
    customer: params.customerId,
    customer_update: { address: "auto", name: "auto" },
    locale: checkoutLocale(params.locale),
    line_items: lineItems,
    metadata: params.metadata,
    success_url: `${params.promotionsPath}?subscription=success`,
    cancel_url: `${params.promotionsPath}?canceled=true`,
  });
}

export async function createBillingPortalSession(): Promise<
  ActionResult<{ url: string }>
> {
  const disabled = supabaseDisabled<{ url: string }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const customerId = await getOrCreateStripeCustomer({
      businessAccountId: session.businessAccountId,
      email: session.email,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const locale = session.preferredLocale ?? "en";
    const promotionsPath = `${appUrl}/${locale}/business/promotions`;

    const portal = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: promotionsPath,
    });

    if (!portal.url) return failure("Failed to open billing portal");
    return success({ url: portal.url });
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to open billing portal"
    );
  }
}

export async function useSubscriptionQuota(
  type: PromotionType,
  targetId?: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;
  const locked = await rejectIfPromotionsLocked<void>();
  if (locked) return locked;

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

    const admin = createAdminClient();
    const { error } = await admin
      .from("subscriptions")
      .update(updatePayload)
      .eq("id", sub.id);

    if (error) return failure(error.message);

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
  const locked = await rejectIfPromotionsLocked<{
    url?: string;
    usedQuota?: boolean;
  }>();
  if (locked) return locked;

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

export async function cancelSubscription(
  businessAccountId?: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    const isAdmin = session.role === "admin";
    const targetId = isAdmin
      ? businessAccountId
      : session.businessAccountId;

    if (!targetId) {
      return failure("Business account required");
    }

    if (!isAdmin && session.businessAccountId !== targetId) {
      return failure("Not authorized");
    }

    if (isAdmin && !businessAccountId) {
      return failure("Business account required");
    }

    const admin = createAdminClient();
    const { data: sub, error } = await admin
      .from("subscriptions")
      .select("id, stripe_subscription_id, status, cancel_at_period_end, current_period_end, billing_type")
      .eq("business_account_id", targetId)
      .maybeSingle();

    if (error) return failure(error.message);
    if (!sub) return failure("No active subscription");
    if (!isPremiumEntitled(sub) && sub.status !== "unpaid") {
      return failure("No active subscription");
    }
    if (sub.billing_type === "one_time" || !sub.stripe_subscription_id) {
      return failure("This Premium period does not auto-renew");
    }
    if (sub.cancel_at_period_end) {
      return failure("Subscription is already set to cancel");
    }

    const stripe = getStripe();
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const { error: updateError } = await admin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);

    if (updateError) return failure(updateError.message);
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to cancel subscription"
    );
  }
}
