"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { hasBlockingPremium, isPremiumEntitled } from "@/lib/stripe/entitlement";
import {
  PREMIUM_PRODUCT,
  PROMOTION_PRICES,
  SUBSCRIPTION_PRICE,
} from "@/lib/stripe/products";
import { activatePromotion } from "@/lib/stripe/activate-promotion";
import { hasActivePromotion } from "@/lib/stripe/promotions";
import { countryName, countryNumeric, splitPersonName } from "@/lib/netopia/billing";
import { NetopiaError, startCardPayment } from "@/lib/netopia/client";
import { isPrelaunchActive } from "@/lib/launch/settings";
import { success, failure } from "@/lib/utils/action-result";
import { getPublicAppUrl } from "@/lib/utils/app-url";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult, PromotionType } from "@/types";

const PROMOTIONS_LOCKED_MESSAGE = "Promotions unlock when Firefly launches.";
const TERMS_REQUIRED_MESSAGE = "You must accept the Terms and Privacy Policy";

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

const TARGET_REQUIRED_TYPES: PromotionType[] = ["event_boost"];

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

function hasQuotaRemaining(sub: SubscriptionRow, type: PromotionType): boolean {
  const mapping = QUOTA_MAP[type];
  const quota = sub[mapping.quota] as number;
  const used = sub[mapping.used] as number;
  return used < quota;
}

async function startNetopiaCheckout(params: {
  businessAccountId: string;
  email: string;
  locale: string;
  amountCents: number;
  productType: string;
  description: string;
  metadata: Record<string, string>;
  successQuery: string;
}): Promise<ActionResult<{ url: string }>> {
  if (!params.email) return failure("Business account required");

  const admin = createAdminClient();
  const { data: business, error: businessError } = await admin
    .from("business_accounts")
    .select(
      "name, legal_name, billing_address, billing_city, billing_county, billing_postal_code, billing_country"
    )
    .eq("id", params.businessAccountId)
    .maybeSingle();
  if (businessError) return failure(businessError.message);
  if (!business) return failure("Business account required");

  const paymentId = randomUUID();
  const { error: insertError } = await admin.from("payments").insert({
    id: paymentId,
    business_account_id: params.businessAccountId,
    provider: "netopia",
    provider_order_id: paymentId,
    type: "one_time",
    product_type: params.productType,
    amount_cents: params.amountCents,
    currency: "ron",
    status: "pending",
    paid_at: null,
    metadata: params.metadata,
  });
  if (insertError) return failure(insertError.message);

  const appUrl = await getPublicAppUrl();
  const locale = params.locale === "ro" ? "ro" : "en";
  const promotionsPath = `${appUrl}/${locale}/business/promotions`;
  const name = splitPersonName(business.legal_name || business.name);
  const countryCode = business.billing_country || "RO";
  const amount = params.amountCents / 100;

  try {
    const started = await startCardPayment({
      orderId: paymentId,
      amount,
      currency: "RON",
      description: params.description,
      language: locale,
      notifyUrl: `${appUrl}/api/webhooks/netopia`,
      redirectUrl: `${promotionsPath}?order=${paymentId}&${params.successQuery}`,
      cancelUrl: `${promotionsPath}?order=${paymentId}&canceled=true`,
      billing: {
        email: params.email,
        firstName: name.firstName,
        lastName: name.lastName,
        city: business.billing_city || "Bucuresti",
        country: countryNumeric(countryCode),
        countryName: countryName(countryCode),
        state: business.billing_county || "Bucuresti",
        postalCode: business.billing_postal_code || "010101",
        details: business.billing_address || business.name,
      },
      product: {
        name: params.description,
        code: params.productType,
        price: amount,
      },
    });

    if (started.ntpId) {
      await admin
        .from("payments")
        .update({ provider_payment_id: started.ntpId })
        .eq("id", paymentId);
    }

    return success({ url: started.paymentUrl });
  } catch (error) {
    await admin
      .from("payments")
      .update({ status: "failed" })
      .eq("id", paymentId)
      .eq("status", "pending");
    const message =
      error instanceof NetopiaError ? error.message : "Failed to start payment";
    return failure(message);
  }
}

export async function createCheckoutSession(
  type: PromotionType,
  targetId?: string,
  options?: { acceptedTerms?: boolean }
): Promise<ActionResult<{ url: string }>> {
  const disabled = supabaseDisabled<{ url: string }>();
  if (disabled) return disabled;
  const locked = await rejectIfPromotionsLocked<{ url: string }>();
  if (locked) return locked;
  if (!options?.acceptedTerms) return failure(TERMS_REQUIRED_MESSAGE);

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const price = PROMOTION_PRICES[type];
    if (!price) return failure("Invalid promotion type");

    const resolvedTargetId =
      type === "feed_post"
        ? undefined
        : (targetId ??
          (TARGET_REQUIRED_TYPES.includes(type)
            ? undefined
            : session.businessAccountId));

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

    const acceptedAt = new Date().toISOString();
    return startNetopiaCheckout({
      businessAccountId: session.businessAccountId,
      email: session.email ?? "",
      locale: session.preferredLocale ?? "en",
      amountCents: price.amount,
      productType: type,
      description: price.label,
      successQuery:
        type === "feed_post" ? "success=true&pack=feed_post" : "success=true",
      metadata: {
        business_account_id: session.businessAccountId,
        promotion_type: type,
        target_id: resolvedTargetId ?? "",
        accepted_terms: "true",
        terms_accepted_at: acceptedAt,
      },
    });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to create checkout");
  }
}

export async function createSubscriptionCheckout(options: {
  acceptedTerms: boolean;
}): Promise<ActionResult<{ url: string }>> {
  const disabled = supabaseDisabled<{ url: string }>();
  if (disabled) return disabled;
  const locked = await rejectIfPromotionsLocked<{ url: string }>();
  if (locked) return locked;

  try {
    if (!options.acceptedTerms) {
      return failure(TERMS_REQUIRED_MESSAGE);
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

    const acceptedAt = new Date().toISOString();
    return startNetopiaCheckout({
      businessAccountId: session.businessAccountId,
      email: session.email ?? "",
      locale: session.preferredLocale ?? "en",
      amountCents: SUBSCRIPTION_PRICE.amount,
      productType: PREMIUM_PRODUCT,
      description: `${SUBSCRIPTION_PRICE.label} (one month)`,
      successQuery: "subscription=success",
      metadata: {
        business_account_id: session.businessAccountId,
        product: PREMIUM_PRODUCT,
        accepted_terms: "true",
        terms_accepted_at: acceptedAt,
      },
    });
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Failed to create subscription checkout"
    );
  }
}

export async function useSubscriptionQuota(
  type: PromotionType,
  targetId?: string,
  options?: { acceptedTerms?: boolean }
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;
  const locked = await rejectIfPromotionsLocked<void>();
  if (locked) return locked;
  if (!options?.acceptedTerms) return failure(TERMS_REQUIRED_MESSAGE);

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

    if (type === "feed_post") {
      return failure("What Did You Miss slots are used when you submit a post");
    }

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
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Failed to use subscription quota"
    );
  }
}

export async function purchasePromotion(
  type: PromotionType,
  targetId?: string,
  options?: { forceCheckout?: boolean; acceptedTerms?: boolean }
): Promise<ActionResult<{ url?: string; usedQuota?: boolean }>> {
  const disabled = supabaseDisabled<{ url?: string; usedQuota?: boolean }>();
  if (disabled) return disabled;
  const locked = await rejectIfPromotionsLocked<{
    url?: string;
    usedQuota?: boolean;
  }>();
  if (locked) return locked;
  if (!options?.acceptedTerms) {
    return failure(TERMS_REQUIRED_MESSAGE);
  }

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const resolvedTargetId =
      type === "feed_post"
        ? undefined
        : (targetId ??
          (TARGET_REQUIRED_TYPES.includes(type)
            ? undefined
            : session.businessAccountId));

    if (TARGET_REQUIRED_TYPES.includes(type) && !resolvedTargetId) {
      return failure("Target selection required");
    }

    if (type !== "feed_post" && !options?.forceCheckout) {
      const sub = await getActiveSubscription(session.businessAccountId);
      if (sub && hasQuotaRemaining(sub, type)) {
        const quotaResult = await useSubscriptionQuota(type, resolvedTargetId, {
          acceptedTerms: true,
        });
        if (quotaResult.success) {
          return success({ usedQuota: true });
        }
        return quotaResult as ActionResult<{ url?: string; usedQuota?: boolean }>;
      }
    }

    const checkout = await createCheckoutSession(type, resolvedTargetId, {
      acceptedTerms: true,
    });
    if (!checkout.success) return checkout;
    return success({ url: checkout.data.url });
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Failed to purchase promotion"
    );
  }
}
