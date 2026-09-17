import type { PromotionType } from "@/types";

export const PROMOTION_PRICES: Record<
  PromotionType,
  { amount: number; currency: "ron"; label: string }
> = {
  event_boost: { amount: 15000, currency: "ron", label: "Promoted Event" },
  feed_post: {
    amount: 10000,
    currency: "ron",
    label: "What Did You Miss? Pack (4 posts)",
  },
  newsletter: { amount: 15000, currency: "ron", label: "Newsletter Inclusion" },
  social_media: {
    amount: 15000,
    currency: "ron",
    label: "Social Media Content",
  },
};

export const PROMOTION_PRICE_ENV: Record<PromotionType, string> = {
  event_boost: "STRIPE_EVENT_BOOST_PRICE_ID",
  feed_post: "STRIPE_FEED_POST_PRICE_ID",
  newsletter: "STRIPE_NEWSLETTER_PRICE_ID",
  social_media: "STRIPE_SOCIAL_MEDIA_PRICE_ID",
};

export function getPromotionPriceId(type: PromotionType): string | undefined {
  const value = process.env[PROMOTION_PRICE_ENV[type]]?.trim();
  return value || undefined;
}

export const SUBSCRIPTION_QUOTAS = {
  quota_promoted_events: 4,
  quota_feed_posts: 4,
  quota_newsletters: 1,
  quota_social_posts: 2,
};

export const FEED_POST_PACK_SIZE = 4;

export const PROMOTION_DURATION_DAYS = 7;

export const PREMIUM_PRODUCT = "premium";

export const SUBSCRIPTION_PRICE = {
  amount: 50000,
  currency: "ron",
  label: "Premium Subscription",
};
