export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type UserRole =
  | "user"
  | "business_venue"
  | "business_organizer"
  | "admin";

export type AccountType = "person" | "business";

export type BusinessType = "venue" | "organizer";

export type BusinessBillingInfo = {
  legalName: string;
  cui: string;
  billingAddress: string;
  billingCity: string;
  billingCounty: string;
  billingPostalCode: string;
  billingCountry: string;
};

export type BusinessStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export type EventStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "published"
  | "archived";

export type EventSource = "business" | "admin";

export type FeedPostCategory =
  | "party_updates"
  | "nightlife_news"
  | "nightlife_chaos"
  | "club_moments";

export type FeedPostStatus =
  | "draft"
  | "pending"
  | "approved"
  | "published"
  | "rejected";

export type PromotionType =
  | "event_boost"
  | "feed_post"
  | "newsletter"
  | "social_media";

export type AnalyticsType =
  | "view"
  | "save"
  | "click"
  | "ticket_click"
  | "share";

export type AnalyticsEntityType = "event" | "feed_post";

export type Genre =
  | "techno"
  | "house"
  | "afro_house"
  | "minimal"
  | "hip_hop_rnb"
  | "commercial"
  | "latin"
  | "manele"
  | "pop"
  | "edm"
  | "live_music"
  | "jazz"
  | "punk"
  | "rock"
  | "open_format"
  | "other";

export type EventType =
  | "party"
  | "concert"
  | "festival"
  | "rooftop"
  | "brunch_day_party"
  | "pool_party"
  | "social_gathering"
  | "club_night"
  | "live_performance"
  | "private_event";

export type DatePreset =
  | "tonight"
  | "tomorrow"
  | "this_weekend"
  | "this_week"
  | "custom";

export type Locale = "en" | "ro";

export type Translations = {
  en?: { title?: string; description?: string; venue_name?: string };
  ro?: { title?: string; description?: string; venue_name?: string };
};
