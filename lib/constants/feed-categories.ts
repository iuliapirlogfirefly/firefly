import type { FeedPostCategory, Locale } from "@/types";

export type FeedCategoryMeta = {
  icon: string;
  label: Record<Locale, string>;
  description: Record<Locale, string>;
};

export const FEED_CATEGORIES: Record<FeedPostCategory, FeedCategoryMeta> = {
  party_updates: {
    icon: "⚡",
    label: { en: "Party Updates", ro: "Noutăți petreceri" },
    description: {
      en: "Sold out, lineup changes, last tables",
      ro: "Sold out, schimbări lineup, ultimele mese",
    },
  },
  nightlife_news: {
    icon: "📰",
    label: { en: "Nightlife News", ro: "Știri nightlife" },
    description: {
      en: "Openings, DJ announcements, collabs",
      ro: "Deschideri, anunțuri DJ, colaborări",
    },
  },
  nightlife_chaos: {
    icon: "🎭",
    label: { en: "Nightlife Chaos", ro: "Haos nightlife" },
    description: {
      en: "Polls, hot takes, crowd reactions",
      ro: "Sondaje, opinii, reacții crowd",
    },
  },
  club_moments: {
    icon: "📸",
    label: { en: "Club Moments", ro: "Momente club" },
    description: {
      en: "Party photos & videos from venues",
      ro: "Poze și clipuri de la petreceri",
    },
  },
};

export const FEED_FILTER_CATEGORIES = [
  "all",
  "party_updates",
  "nightlife_news",
  "nightlife_chaos",
] as const;

export type FeedFilterCategory = (typeof FEED_FILTER_CATEGORIES)[number];

export function getCategoryMeta(category: FeedPostCategory, locale: Locale) {
  const meta = FEED_CATEGORIES[category];
  return {
    icon: meta.icon,
    label: meta.label[locale],
    description: meta.description[locale],
  };
}
