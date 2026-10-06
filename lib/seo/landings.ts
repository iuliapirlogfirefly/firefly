import type { EventType, Genre, Locale } from "@/types";
import type { EventFilters, EventListItem } from "@/types/events";
import {
  bucharestDateWindow,
  type BucharestDateWindow,
} from "@/lib/seo/bucharest-dates";

export const PARTY_EVENT_TYPES = [
  "party",
  "club_night",
  "rooftop",
  "pool_party",
  "brunch_day_party",
] as const satisfies readonly EventType[];

export type LandingId =
  | "parties"
  | "events"
  | "nightlife"
  | "clubs"
  | "concerts";

export type TimeFacetId = BucharestDateWindow;

export type GenreFacetId =
  | "techno"
  | "house"
  | "afro_house"
  | "minimal"
  | "hip_hop_rnb"
  | "edm"
  | "latin"
  | "jazz"
  | "rock";

export type FacetId = TimeFacetId | GenreFacetId;

type LocalizedSlug = Record<Locale, string>;

type HubDefinition = {
  id: LandingId;
  slugs: LocalizedSlug;
  kind: "list" | "guide" | "clubs";
};

type FacetDefinition = {
  id: FacetId;
  slugs: LocalizedSlug;
  time?: TimeFacetId;
  genre?: Genre;
};

export const LANDING_HUBS: readonly HubDefinition[] = [
  { id: "parties", slugs: { en: "parties", ro: "petreceri" }, kind: "list" },
  { id: "events", slugs: { en: "events", ro: "evenimente" }, kind: "list" },
  {
    id: "nightlife",
    slugs: { en: "nightlife", ro: "viata-de-noapte" },
    kind: "guide",
  },
  { id: "clubs", slugs: { en: "clubs", ro: "cluburi" }, kind: "clubs" },
  { id: "concerts", slugs: { en: "concerts", ro: "concerte" }, kind: "list" },
];

export const LANDING_FACETS: readonly FacetDefinition[] = [
  { id: "tonight", slugs: { en: "tonight", ro: "azi" }, time: "tonight" },
  { id: "tomorrow", slugs: { en: "tomorrow", ro: "maine" }, time: "tomorrow" },
  { id: "weekend", slugs: { en: "weekend", ro: "weekend" }, time: "weekend" },
  {
    id: "this_week",
    slugs: { en: "this-week", ro: "saptamana-aceasta" },
    time: "this_week",
  },
  { id: "thursday", slugs: { en: "thursday", ro: "joi" }, time: "thursday" },
  { id: "friday", slugs: { en: "friday", ro: "vineri" }, time: "friday" },
  { id: "saturday", slugs: { en: "saturday", ro: "sambata" }, time: "saturday" },
  { id: "sunday", slugs: { en: "sunday", ro: "duminica" }, time: "sunday" },
  { id: "techno", slugs: { en: "techno", ro: "techno" }, genre: "techno" },
  { id: "house", slugs: { en: "house", ro: "house" }, genre: "house" },
  {
    id: "afro_house",
    slugs: { en: "afro-house", ro: "afro-house" },
    genre: "afro_house",
  },
  { id: "minimal", slugs: { en: "minimal", ro: "minimal" }, genre: "minimal" },
  {
    id: "hip_hop_rnb",
    slugs: { en: "hip-hop", ro: "hip-hop" },
    genre: "hip_hop_rnb",
  },
  { id: "edm", slugs: { en: "edm", ro: "edm" }, genre: "edm" },
  { id: "latin", slugs: { en: "latin", ro: "latin" }, genre: "latin" },
  { id: "jazz", slugs: { en: "jazz", ro: "jazz" }, genre: "jazz" },
  { id: "rock", slugs: { en: "rock", ro: "rock" }, genre: "rock" },
];

const TIME_FACET_IDS = new Set<FacetId>([
  "tonight",
  "tomorrow",
  "weekend",
  "this_week",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export function hubById(id: LandingId): HubDefinition {
  const hub = LANDING_HUBS.find((item) => item.id === id);
  if (!hub) throw new Error(`Unknown landing hub: ${id}`);
  return hub;
}

export function facetById(id: FacetId): FacetDefinition {
  const facet = LANDING_FACETS.find((item) => item.id === id);
  if (!facet) throw new Error(`Unknown landing facet: ${id}`);
  return facet;
}

export function isTimeFacet(id: FacetId): boolean {
  return TIME_FACET_IDS.has(id);
}

export function hubPath(locale: Locale, id: LandingId): string {
  return `/${hubById(id).slugs[locale]}`;
}

export function facetPath(locale: Locale, id: FacetId): string {
  return `${hubPath(locale, "parties")}/${facetById(id).slugs[locale]}`;
}

export function landingPaths(
  hubId: LandingId,
  facetId?: FacetId
): { en: string; ro: string } {
  if (facetId) {
    return { en: facetPath("en", facetId), ro: facetPath("ro", facetId) };
  }
  return { en: hubPath("en", hubId), ro: hubPath("ro", hubId) };
}

export function seoLockedPaths(): { exact: string[]; prefixes: string[] } {
  const slugs = new Set<string>();
  for (const hub of LANDING_HUBS) {
    slugs.add(`/${hub.slugs.en}`);
    slugs.add(`/${hub.slugs.ro}`);
  }
  const exact = [...slugs];
  return {
    exact,
    prefixes: exact.map((path) => `${path}/`),
  };
}

function findHub(slug: string): HubDefinition | undefined {
  return LANDING_HUBS.find(
    (hub) => hub.slugs.en === slug || hub.slugs.ro === slug
  );
}

function findFacet(slug: string): FacetDefinition | undefined {
  return LANDING_FACETS.find(
    (facet) => facet.slugs.en === slug || facet.slugs.ro === slug
  );
}

export function resolveHubSlug(
  locale: Locale,
  slug: string
): { hub: HubDefinition; redirectTo: string | null } | null {
  const hub = findHub(slug);
  if (!hub) return null;
  const canonical = hubPath(locale, hub.id);
  return {
    hub,
    redirectTo: `/${slug}` === canonical ? null : canonical,
  };
}

export function resolveFacetSlug(
  locale: Locale,
  landingSlug: string,
  facetSlug: string
): { hub: HubDefinition; facet: FacetDefinition; redirectTo: string | null } | null {
  const hub = findHub(landingSlug);
  if (!hub || hub.id !== "parties") return null;
  const facet = findFacet(facetSlug);
  if (!facet) return null;
  const canonical = facetPath(locale, facet.id);
  const requested = `/${landingSlug}/${facetSlug}`;
  return {
    hub,
    facet,
    redirectTo: requested === canonical ? null : canonical,
  };
}

export function filtersForLanding(
  hubId: LandingId,
  facetId?: FacetId,
  now = new Date()
): EventFilters {
  if (hubId === "events") return {};
  if (hubId === "clubs") return { eventType: "club_night" };
  if (hubId === "concerts") {
    return { eventTypes: ["concert", "live_performance"] };
  }

  const filters: EventFilters = { eventTypes: [...PARTY_EVENT_TYPES] };
  if (!facetId || hubId !== "parties") return filters;

  const facet = facetById(facetId);
  if (facet.genre) filters.genre = facet.genre;
  if (facet.time) filters.startsAtRange = bucharestDateWindow(facet.time, now);
  return filters;
}

export function eventMatchesLanding(
  event: EventListItem,
  filters: EventFilters
): boolean {
  if (filters.genre && !event.genres.includes(filters.genre)) return false;
  if (filters.eventType && event.eventType !== filters.eventType) return false;
  if (
    filters.eventTypes &&
    filters.eventTypes.length > 0 &&
    !filters.eventTypes.includes(event.eventType)
  ) {
    return false;
  }
  if (filters.startsAtRange) {
    const start = new Date(event.startsAt).getTime();
    if (
      start < filters.startsAtRange.start.getTime() ||
      start > filters.startsAtRange.end.getTime()
    ) {
      return false;
    }
  }
  return true;
}

export function eventTypeLanding(eventType: EventType): LandingId {
  if (eventType === "club_night") return "clubs";
  if (eventType === "concert" || eventType === "live_performance") {
    return "concerts";
  }
  if (
    PARTY_EVENT_TYPES.includes(
      eventType as (typeof PARTY_EVENT_TYPES)[number]
    )
  ) {
    return "parties";
  }
  return "events";
}

export function genreFacetFor(genre: string): FacetDefinition | undefined {
  return LANDING_FACETS.find((facet) => facet.genre === genre);
}
