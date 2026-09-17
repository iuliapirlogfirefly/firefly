import type { FeedPostCategory } from "@/types";

export const FEED_CATEGORY_ICONS: Record<FeedPostCategory, string> = {
  party_updates: "⚡",
  nightlife_news: "📰",
  nightlife_chaos: "🎭",
  club_moments: "📸",
};

export const FEED_CATEGORIES = FEED_CATEGORY_ICONS;

export const FEED_FILTER_CATEGORIES = [
  "all",
  "party_updates",
  "nightlife_news",
  "nightlife_chaos",
] as const;

export type FeedFilterCategory = (typeof FEED_FILTER_CATEGORIES)[number];

export function getCategoryMeta(
  category: FeedPostCategory,
  t: (key: string) => string
) {
  return {
    icon: FEED_CATEGORY_ICONS[category],
    label: t(`${category}.label`),
    description: t(`${category}.description`),
  };
}
