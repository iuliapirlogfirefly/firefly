import type { PromotionType } from "@/types";

export const PROMOTION_PRICES: Record<
  Exclude<PromotionType, "newsletter" | "social_media"> | "newsletter" | "social_media",
  { amount: number; currency: string; label: string }
> = {
  event_boost: { amount: 3000, currency: "eur", label: "Promoted Event" },
  feed_post: { amount: 2000, currency: "eur", label: "Feed Post" },
  newsletter: { amount: 3000, currency: "eur", label: "Newsletter Inclusion" },
  social_media: { amount: 3000, currency: "eur", label: "Social Media Post" },
};

export const SUBSCRIPTION_QUOTAS = {
  quota_promoted_events: 4,
  quota_feed_posts: 4,
  quota_newsletters: 2,
  quota_social_posts: 2,
};

export const PROMOTION_DURATION_DAYS = 7;

export const PREMIUM_PRODUCT = "premium";

export const SUBSCRIPTION_PRICE = {
  amount: 50000,
  currency: "ron",
  label: "Premium Subscription",
};
