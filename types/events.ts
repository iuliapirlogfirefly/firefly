import type {
  DatePreset,
  EventType,
  Genre,
  Locale,
} from "./index";

export type EventFilters = {
  genre?: Genre;
  eventType?: EventType;
  datePreset?: DatePreset;
  customDate?: string;
  distanceKm?: number;
  lat?: number;
  lng?: number;
  promotedOnly?: boolean;
  search?: string;
};

export type EventListItem = {
  id: string;
  slug: string;
  title: string;
  venueName: string;
  price: number | null;
  startsAt: string;
  endsAt: string | null;
  coverImageUrl: string | null;
  genre: Genre;
  eventType: EventType;
  isPromoted: boolean;
  promotionIntensity: 1 | 2 | 3;
  lat: number;
  lng: number;
};

export type EventDetail = EventListItem & {
  description: string;
  address: string;
  ticketUrl: string | null;
  websiteUrl: string | null;
  specialGuest: string | null;
  images: string[];
  organizerName: string | null;
  isSaved: boolean;
  isReminded: boolean;
};

export type EventMapPoint = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    id: string;
    slug: string;
    title: string;
    isPromoted: boolean;
    promotionIntensity: 1 | 2 | 3;
    startsAt: string;
    genre: Genre;
  };
};

export type EventsGeoJSON = {
  type: "FeatureCollection";
  features: EventMapPoint[];
};

export type CalendarDayEvents = {
  date: string;
  events: EventListItem[];
};

export type CreateEventInput = {
  translations: {
    en: { title: string; description: string };
    ro?: { title?: string; description?: string };
  };
  startsAt: string;
  endsAt?: string;
  genre: Genre;
  eventType: EventType;
  price?: number;
  ticketUrl?: string;
  websiteUrl?: string;
  specialGuest?: string;
  coverImageUrl?: string;
  images?: string[];
  venueId?: string;
  venueName?: string;
  address?: string;
  lat?: number;
  lng?: number;
};

export type UpdateEventInput = Partial<CreateEventInput>;

export type CreateFeedPostInput = {
  category: import("./index").FeedPostCategory;
  translations: {
    en: { title: string; description: string };
    ro?: { title?: string; description?: string };
  };
  mediaUrl?: string;
};

export type UpdateFeedPostInput = CreateFeedPostInput;

export type SessionInfo = {
  userId: string | null;
  role: import("./index").UserRole | "guest";
  email: string | null;
  displayName: string | null;
  preferredLocale: Locale;
  businessAccountId: string | null;
  isSuspended: boolean;
};
