import type { Locale } from "@/types";
import type {
  CalendarDayEvents,
  EventDetail,
  EventFilters,
  EventListItem,
  EventsGeoJSON,
} from "@/types/events";
import { eventImages, landingImages } from "@/lib/landing/images";
import type { FeedPostItem } from "@/lib/queries/feed";
import { getDateRange } from "@/lib/filters/event-filters";
import { eventsToGeoJSON } from "@/lib/maps/geojson";
import type { Tables } from "@/types/database.types";

type EventRow = Tables<"events">;

const tonight = new Date();
tonight.setHours(23, 0, 0, 0);

const todayEvening = new Date();
todayEvening.setHours(21, 30, 0, 0);

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(23, 0, 0, 0);

const dayAfter = new Date(tomorrow);
dayAfter.setDate(dayAfter.getDate() + 1);
dayAfter.setHours(6, 0, 0, 0);

const weekend = new Date();
weekend.setDate(weekend.getDate() + 3);
weekend.setHours(22, 0, 0, 0);

function row(
  partial: Partial<EventRow> & Pick<EventRow, "id" | "slug" | "translations">
): EventRow {
  return {
    business_account_id: null,
    venue_id: null,
    status: "published",
    source: "admin",
    ends_at: dayAfter.toISOString(),
    genre: "techno",
    event_type: "club_night",
    price: 50,
    ticket_url: "https://example.com/tickets",
    website_url: "https://example.com",
    special_guest: null,
    organizer_name: null,
    cover_image_url: null,
    images: [],
    is_promoted: false,
    promotion_intensity: 1,
    rejection_reason: null,
    lat: 44.4378,
    lng: 26.0966,
    address: "Strada Academiei 19, Bucharest",
    venue_name: "Control Club",
    search_vector: null,
    published_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    starts_at: tomorrow.toISOString(),
    ...partial,
  };
}

const MOCK_EVENT_ROWS: EventRow[] = [
  row({
    id: "mock-1",
    slug: "techno-night-control-club",
    genre: "techno",
    event_type: "club_night",
    is_promoted: true,
    promotion_intensity: 3,
    special_guest: "DJ Ion Popescu",
    organizer_name: "Nightshift Collective",
    cover_image_url: eventImages.event1,
    translations: {
      en: {
        title: "Techno Night at Control Club",
        description: "Underground techno all night long.",
      },
      ro: {
        title: "Noapte Techno la Control Club",
        description: "Techno underground toată noaptea.",
      },
    },
  }),
  row({
    id: "mock-2",
    slug: "house-garden-kulturhaus",
    genre: "house",
    event_type: "party",
    lat: 44.4268,
    lng: 26.1025,
    address: "Strada Blănari 21, Bucharest",
    venue_name: "Kulturhaus",
    starts_at: weekend.toISOString(),
    ends_at: new Date(weekend.getTime() + 6 * 60 * 60 * 1000).toISOString(),
    price: 40,
    cover_image_url: eventImages.event4,
    translations: {
      en: {
        title: "House Garden Party",
        description: "Open air house music experience.",
      },
      ro: {
        title: "Petrecere House în Grădină",
        description: "Experiență house music în aer liber.",
      },
    },
  }),
  row({
    id: "mock-3",
    slug: "afro-house-rooftop",
    genre: "afro_house",
    event_type: "rooftop",
    is_promoted: true,
    promotion_intensity: 2,
    lat: 44.4412,
    lng: 26.0898,
    address: "Calea Victoriei 155, Bucharest",
    venue_name: "Sky Lounge",
    price: 60,
    cover_image_url: eventImages.event4,
    starts_at: new Date(weekend.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    translations: {
      en: {
        title: "Afro House Rooftop Sunset",
        description: "Sunset session with afro house vibes.",
      },
      ro: {
        title: "Afro House Rooftop Apus",
        description: "Sesiune la apus cu vibe-uri afro house.",
      },
    },
  }),
  row({
    id: "mock-4",
    slug: "subterra-all-night-long",
    genre: "techno",
    event_type: "club_night",
    is_promoted: true,
    promotion_intensity: 3,
    lat: 44.4355,
    lng: 26.0988,
    address: "Strada Gabroveni 50, Bucharest",
    venue_name: "Subterra",
    price: 35,
    cover_image_url: eventImages.event2,
    starts_at: tomorrow.toISOString(),
    translations: {
      en: {
        title: "Subterra: All Night Long",
        description: "Warehouse techno until sunrise.",
      },
      ro: {
        title: "Subterra: Toată Noaptea",
        description: "Techno warehouse până la răsărit.",
      },
    },
  }),
  row({
    id: "mock-5",
    slug: "jazz-cellar-friday",
    genre: "jazz",
    event_type: "live_performance",
    lat: 44.4298,
    lng: 26.1042,
    address: "Strada Franceză 62, Bucharest",
    venue_name: "Green Hours",
    price: 45,
    cover_image_url: eventImages.event3,
    starts_at: new Date(weekend.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    translations: {
      en: {
        title: "Jazz Cellar Sessions",
        description: "Intimate live jazz in the Old Town.",
      },
      ro: {
        title: "Sesiuni Jazz Cellar",
        description: "Jazz live intim în Centrul Vechi.",
      },
    },
  }),
  row({
    id: "mock-6",
    slug: "disco-edits-tonight",
    genre: "house",
    event_type: "club_night",
    lat: 44.4321,
    lng: 26.0945,
    address: "Strada Smârdan 30, Bucharest",
    venue_name: "Expirat",
    price: 30,
    cover_image_url: eventImages.event1,
    starts_at: tonight.toISOString(),
    translations: {
      en: {
        title: "Disco Edits · Tonight",
        description: "Boogie, edits, and sweat until late.",
      },
      ro: {
        title: "Disco Edits · Diseară",
        description: "Boogie, edits și transpirație până târziu.",
      },
    },
  }),
  row({
    id: "mock-7",
    slug: "warehouse-rave-friday",
    genre: "techno",
    event_type: "club_night",
    is_promoted: true,
    promotion_intensity: 2,
    lat: 44.4488,
    lng: 26.1122,
    address: "Splaiul Unirii 160, Bucharest",
    venue_name: "Kristal Glam Club",
    price: 55,
    cover_image_url: eventImages.event2,
    starts_at: todayEvening.toISOString(),
    translations: {
      en: {
        title: "Warehouse Rave",
        description: "Raw techno in an industrial pocket of the city.",
      },
      ro: {
        title: "Warehouse Rave",
        description: "Techno brut într-un colț industrial al orașului.",
      },
    },
  }),
  row({
    id: "mock-8",
    slug: "sunset-sessions-rooftop",
    genre: "house",
    event_type: "rooftop",
    lat: 44.4412,
    lng: 26.0898,
    address: "Calea Victoriei 155, Bucharest",
    venue_name: "Sky Lounge",
    price: 0,
    cover_image_url: eventImages.event4,
    starts_at: new Date(weekend.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    translations: {
      en: {
        title: "Sunset Sessions",
        description: "Free entry before 20:00. House and cold drinks.",
      },
      ro: {
        title: "Sunset Sessions",
        description: "Intrare liberă înainte de 20:00. House și băuturi reci.",
      },
    },
  }),
];

export const MOCK_BUSINESS_ACCOUNT_ID = "mock-business-1";
export const MOCK_USER_ID = "mock-user-1";

const MOCK_PENDING_EVENT_ROWS: EventRow[] = [
  row({
    id: "mock-pending-1",
    slug: "pending-minimal-monday",
    status: "pending",
    source: "business",
    business_account_id: MOCK_BUSINESS_ACCOUNT_ID,
    genre: "minimal",
    event_type: "club_night",
    venue_name: "Guest House",
    price: 40,
    special_guest: "DJ Ion",
    ticket_url: "https://example.com/tickets/minimal-monday",
    website_url: "https://example.com/guesthouse",
    cover_image_url: eventImages.event3,
    images: [eventImages.event1, eventImages.event2],
    starts_at: new Date(weekend.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    translations: {
      en: {
        title: "Minimal Monday",
        description: "Deep minimal for the patient dancers.",
      },
      ro: {
        title: "Minimal Monday",
        description: "Minimal adânc pentru dansatorii răbdători.",
      },
    },
  }),
  row({
    id: "mock-pending-2",
    slug: "pending-breakfast-club",
    status: "pending",
    source: "business",
    business_account_id: MOCK_BUSINESS_ACCOUNT_ID,
    genre: "house",
    event_type: "party",
    venue_name: "Kulturhaus",
    price: 35,
    cover_image_url: eventImages.event4,
    starts_at: new Date(weekend.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    translations: {
      en: {
        title: "Breakfast Club",
        description: "Morning house party for the brave.",
      },
      ro: {
        title: "Breakfast Club",
        description: "Petrecere house de dimineață pentru curajoși.",
      },
    },
  }),
];

const MOCK_BUSINESS_EVENT_ROWS: EventRow[] = [
  ...MOCK_EVENT_ROWS.filter((e) =>
    ["mock-1", "mock-4", "mock-6"].includes(e.id)
  ).map((e) => ({ ...e, business_account_id: MOCK_BUSINESS_ACCOUNT_ID })),
  row({
    id: "mock-biz-draft",
    slug: "draft-summer-series",
    business_account_id: MOCK_BUSINESS_ACCOUNT_ID,
    status: "draft",
    genre: "house",
    event_type: "party",
    venue_name: "Control Club",
    price: 45,
    cover_image_url: eventImages.event4,
    starts_at: new Date(weekend.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    translations: {
      en: {
        title: "Summer Series (draft)",
        description: "Not published yet.",
      },
      ro: {
        title: "Seria de vară (draft)",
        description: "Încă nepublicat.",
      },
    },
  }),
  row({
    id: "mock-biz-rejected",
    slug: "rejected-warehouse-night",
    business_account_id: MOCK_BUSINESS_ACCOUNT_ID,
    status: "rejected",
    genre: "techno",
    event_type: "party",
    venue_name: "Control Club",
    price: 40,
    cover_image_url: eventImages.event4,
    starts_at: new Date(weekend.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    rejection_reason:
      "Cover image is too dark and the description is missing the start time.",
    translations: {
      en: {
        title: "Warehouse Night (rejected)",
        description: "Needs a clearer poster and schedule.",
      },
      ro: {
        title: "Noapte warehouse (respins)",
        description: "Are nevoie de un poster mai clar și de program.",
      },
    },
  }),
];

function mapRowToListItem(event: EventRow, locale: Locale): EventListItem {
  const t = event.translations as Record<string, { title?: string }>;
  return {
    id: event.id,
    slug: event.slug,
    title: t[locale]?.title ?? t.en?.title ?? "",
    venueName: event.venue_name ?? "",
    price: event.price,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    coverImageUrl: event.cover_image_url,
    genre: event.genre as EventListItem["genre"],
    eventType: event.event_type as EventListItem["eventType"],
    isPromoted: event.is_promoted,
    promotionIntensity: event.promotion_intensity as 1 | 2 | 3,
    lat: event.lat,
    lng: event.lng,
  };
}

function filterMockEvents(
  events: EventRow[],
  filters: EventFilters
): EventRow[] {
  let result = [...events];

  if (filters.genre) {
    result = result.filter((e) => e.genre === filters.genre);
  }
  if (filters.eventType) {
    result = result.filter((e) => e.event_type === filters.eventType);
  }
  if (filters.promotedOnly) {
    result = result.filter((e) => e.is_promoted);
  }

  const dateRange = getDateRange(filters);
  if (dateRange) {
    result = result.filter((e) => {
      const start = new Date(e.starts_at);
      return start >= dateRange.start && start <= dateRange.end;
    });
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((e) => {
      const t = e.translations as Record<string, { title?: string }>;
      const title = `${t.en?.title ?? ""} ${t.ro?.title ?? ""}`.toLowerCase();
      return title.includes(q) || (e.venue_name ?? "").toLowerCase().includes(q);
    });
  }

  return result.sort((a, b) => {
    if (a.is_promoted !== b.is_promoted) return a.is_promoted ? -1 : 1;
    return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
  });
}

export function getMockEvents(
  locale: Locale,
  filters: EventFilters = {}
): EventListItem[] {
  return filterMockEvents(MOCK_EVENT_ROWS, filters).map((e) =>
    mapRowToListItem(e, locale)
  );
}

export function getMockEventsGeoJSON(
  locale: Locale,
  filters: EventFilters = {}
): EventsGeoJSON {
  const filtered = filterMockEvents(MOCK_EVENT_ROWS, filters);
  return eventsToGeoJSON(filtered, locale);
}

export function getMockEventBySlug(
  slug: string,
  locale: Locale
): EventDetail | null {
  const event = MOCK_EVENT_ROWS.find((e) => e.slug === slug);
  if (!event) return null;

  const t = event.translations as Record<
    string,
    { title?: string; description?: string }
  >;

  return {
    ...mapRowToListItem(event, locale),
    description: t[locale]?.description ?? t.en?.description ?? "",
    address: event.address ?? "",
    ticketUrl: event.ticket_url,
    websiteUrl: event.website_url,
    specialGuest: event.special_guest,
    images: event.images ?? [],
    organizerName: event.organizer_name,
    isSaved: false,
    isReminded: false,
  };
}

export function getMockCalendarEvents(
  locale: Locale,
  month: number,
  year: number,
  filters: EventFilters = {}
): CalendarDayEvents[] {
  const filtered = filterMockEvents(MOCK_EVENT_ROWS, filters).filter((e) => {
    const d = new Date(e.starts_at);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const byDate = new Map<string, EventListItem[]>();
  for (const event of filtered) {
    const dateKey = event.starts_at.split("T")[0];
    const items = byDate.get(dateKey) ?? [];
    items.push(mapRowToListItem(event, locale));
    byDate.set(dateKey, items);
  }

  return Array.from(byDate.entries()).map(([date, events]) => ({
    date,
    events,
  }));
}

export function getMockFeedPosts(locale: Locale): FeedPostItem[] {
  const ro = locale === "ro";

  return [
    {
      id: "mock-post-1",
      category: "party_updates",
      title: ro ? "SOLD OUT — Techno Night" : "SOLD OUT — Techno Night",
      description: ro
        ? "Ultimele bilete au dispărut în 40 de minute. Urmărește feed-ul pentru surprize la ușă."
        : "Last tickets gone in 40 minutes. Watch the feed for door surprises.",
      mediaUrl: eventImages.event1,
      publishedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-post-2",
      category: "nightlife_chaos",
      title: ro ? "Deja aglomerat la Doors" : "Crowded already at Doors",
      description: ro
        ? "Coada întoarce colțul pe Academiei. Dacă nu ești în listă, ia-ți timp."
        : "The queue wraps around the corner on Academiei. If you're not on the list, budget time.",
      mediaUrl: landingImages.editorialCrowd,
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-post-3",
      category: "party_updates",
      title: ro ? "Guest surprise: ANNA" : "Guest surprise: ANNA",
      description: ro
        ? "Lineup-ul de la Subterra tocmai a primit un upgrade neanunțat. Set de închidere."
        : "Subterra's lineup just got an unannounced upgrade. Closing set incoming.",
      mediaUrl: eventImages.event2,
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-post-4",
      category: "nightlife_news",
      title: ro ? "Deschidere rooftop nou" : "New rooftop opening",
      description: ro
        ? "Sky Lounge deschide sezonul de vară vineri. Prima seară: sunset afro house."
        : "Sky Lounge kicks off summer season Friday. Opening night: sunset afro house.",
      mediaUrl: eventImages.event4,
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-post-5",
      category: "nightlife_chaos",
      title: ro ? "Sondaj: cel mai bun after?" : "Poll: best afterparty?",
      description: ro
        ? "Votează în story — câștigătorul primește listă la următoarea petrecere."
        : "Vote in stories — winner gets on the list for the next party.",
      mediaUrl: null,
      publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-post-6",
      category: "party_updates",
      title: ro ? "Ultimele mese libere" : "Last tables available",
      description: ro
        ? "Mai sunt 3 mese la petrecerea de diseară. Rezervă înainte de 22:00."
        : "3 tables left for tonight's party. Reserve before 10pm.",
      mediaUrl: eventImages.event3,
      publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-post-7",
      category: "nightlife_news",
      title: ro ? "Collab: Kulturhaus × local collective" : "Collab: Kulturhaus × local collective",
      description: ro
        ? "O serie de 4 seri în grădină începe luna viitoare. Lineup complet joi."
        : "A 4-night garden series starts next month. Full lineup drops Thursday.",
      mediaUrl: landingImages.editorialDj,
      publishedAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-post-8",
      category: "nightlife_chaos",
      title: ro ? "Hot take: techno înainte de 1" : "Hot take: techno before 1am",
      description: ro
        ? "Dezbaterie aprinsă în comentarii. Echipa Firefly rămâne neutră — dar dansează."
        : "Heated debate in the comments. Team Firefly stays neutral — but dancing.",
      mediaUrl: landingImages.editorialStreet,
      publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-post-9",
      category: "party_updates",
      title: ro ? "Afterhours mutat la Guesthouse" : "Afterhours moved to Guesthouse",
      description: ro
        ? "Doors se închide la 05:00. Continui pe Academiei — listă până la 05:30."
        : "Doors closes at 5am. Continue on Academiei — list until 5:30.",
      mediaUrl: landingImages.heroCrowd,
      publishedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-post-10",
      category: "nightlife_chaos",
      title: ro ? "Ploaia vs rooftop: cine a câștigat?" : "Rain vs rooftop: who won?",
      description: ro
        ? "Sky Lounge a ținut deschis. Crowd-ul a dansat ud, nimeni nu a plecat."
        : "Sky Lounge stayed open. The crowd danced wet, nobody left.",
      mediaUrl: landingImages.editorialStreet,
      publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-post-11",
      category: "party_updates",
      title: ro ? "B2B neanunțat la Expirat" : "Unannounced B2B at Expirat",
      description: ro
        ? "Doi headlineri pe aceeași masă după 3. Fără anunț, fără encore — doar mix."
        : "Two headliners on the same decks after 3. No announcement, no encore — just the mix.",
      mediaUrl: landingImages.editorialDj,
      publishedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export function getMockSavedEvents(locale: Locale): EventListItem[] {
  return ["mock-1", "mock-4", "mock-7"].map((id) => {
    const event = MOCK_EVENT_ROWS.find((e) => e.id === id)!;
    return mapRowToListItem(event, locale);
  });
}

export function getMockPendingEvents(locale: Locale) {
  return MOCK_PENDING_EVENT_ROWS.map((e) => ({
    ...mapRowToListItem(e, locale),
    status: e.status,
    rejectionReason: e.rejection_reason,
  }));
}

export function getMockAdminEventRow(id: string): EventRow | null {
  return (
    MOCK_PENDING_EVENT_ROWS.find((e) => e.id === id) ??
    MOCK_BUSINESS_EVENT_ROWS.find((e) => e.id === id) ??
    MOCK_EVENT_ROWS.find((e) => e.id === id) ??
    null
  );
}

const MOCK_ADMIN_FEED_POSTS = [
  {
    id: "mock-pending-post-1",
    category: "nightlife_news" as const,
    status: "pending",
    mediaUrl: landingImages.editorialDj,
    createdAt: new Date().toISOString(),
    publishedAt: null as string | null,
    rejectionReason: null as string | null,
    businessAccountId: MOCK_BUSINESS_ACCOUNT_ID,
    businessName: "Control Club",
    translations: {
      en: {
        title: "Resident DJ announcement",
        description: "A new resident joins the Friday lineup.",
      },
      ro: {
        title: "Anunț DJ resident",
        description: "Un nou resident se alătură lineup-ului de vineri.",
      },
    },
  },
  {
    id: "mock-pending-post-2",
    category: "party_updates" as const,
    status: "pending",
    mediaUrl: null as string | null,
    createdAt: new Date().toISOString(),
    publishedAt: null as string | null,
    rejectionReason: null as string | null,
    businessAccountId: MOCK_BUSINESS_ACCOUNT_ID,
    businessName: "Control Club",
    translations: {
      en: {
        title: "Doors time change",
        description: "Party now starts at 11:30pm instead of 11pm.",
      },
      ro: {
        title: "Schimbare oră deschidere",
        description: "Petrecerea începe la 23:30 în loc de 23:00.",
      },
    },
  },
];

export function getMockAdminFeedPost(id: string) {
  const pending = MOCK_ADMIN_FEED_POSTS.find((post) => post.id === id);
  if (pending) return pending;

  const published = getMockFeedPosts("en").find((post) => post.id === id);
  if (!published) return null;

  const ro = getMockFeedPosts("ro").find((post) => post.id === id);

  return {
    id: published.id,
    category: published.category,
    status: "published",
    mediaUrl: published.mediaUrl,
    createdAt: published.publishedAt,
    publishedAt: published.publishedAt,
    rejectionReason: null as string | null,
    businessAccountId: MOCK_BUSINESS_ACCOUNT_ID,
    businessName: "Control Club",
    translations: {
      en: { title: published.title, description: published.description },
      ro: ro
        ? { title: ro.title, description: ro.description }
        : undefined,
    },
  };
}

export function getMockBusinessEvents(locale: Locale) {
  return MOCK_BUSINESS_EVENT_ROWS.map((e) => ({
    ...mapRowToListItem(e, locale),
    status: e.status,
    rejectionReason: e.rejection_reason,
  }));
}

export function getMockPendingFeedPosts(locale: Locale) {
  return MOCK_ADMIN_FEED_POSTS.map((post) => {
    const localized = locale === "ro" && post.translations.ro
      ? post.translations.ro
      : post.translations.en;

    return {
      id: post.id,
      category: post.category,
      title: localized.title,
      description: localized.description,
      mediaUrl: post.mediaUrl,
      publishedAt: post.createdAt,
      status: post.status,
      rejectionReason: post.rejectionReason,
      businessName: post.businessName,
    };
  });
}

export function getMockAdminAnalytics() {
  return {
    totalUsers: 1247,
    totalEvents: 84,
    totalBusinesses: 23,
    totalVenues: 14,
    totalOrganizers: 9,
    publishedEvents: 76,
    pendingEvents: 2,
    analytics: {
      views: 18420,
      saves: 3210,
      clicks: 8920,
      ticketClicks: 1540,
      shares: 680,
    },
    activePromotions: 5,
    activeSubscriptions: 12,
    totalRevenueCents: 284500,
    currency: "ron",
    revenueBreakdown: [
      { key: "subscription", label: "Premium Monthly", amountCents: 120000 },
      { key: "event_boost", label: "Promoted Event", amountCents: 90000 },
      { key: "feed_post", label: "What did you missed post", amountCents: 40000 },
      { key: "newsletter", label: "Newsletter Inclusion", amountCents: 24000 },
      { key: "social_media", label: "Social Media Post", amountCents: 10500 },
    ],
    deltas: {
      totalUsers: 12,
      totalEvents: 8,
      totalBusinesses: 5,
      totalRevenueCents: 18,
      views: 14,
      saves: -3,
      clicks: 9,
      ticketClicks: 6,
      shares: 11,
    },
  };
}

export function getMockBusinessAnalytics(locale: Locale = "en") {
  const events = getMockBusinessEvents(locale).map((event, index) => {
    const counts = [
      { views: 1420, saves: 210, clicks: 480, ticketClicks: 98, shares: 28 },
      { views: 890, saves: 124, clicks: 280, ticketClicks: 52, shares: 16 },
      { views: 410, saves: 58, clicks: 120, ticketClicks: 28, shares: 8 },
      { views: 120, saves: 20, clicks: 40, ticketClicks: 8, shares: 2 },
    ][index] ?? {
      views: 0,
      saves: 0,
      clicks: 0,
      ticketClicks: 0,
      shares: 0,
    };

    return {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      status: event.status,
      isPromoted: event.isPromoted,
      rejectionReason: event.rejectionReason,
      ...counts,
    };
  });

  const totals = events.reduce(
    (acc, event) => ({
      views: acc.views + event.views,
      saves: acc.saves + event.saves,
      clicks: acc.clicks + event.clicks,
      ticketClicks: acc.ticketClicks + event.ticketClicks,
      shares: acc.shares + event.shares,
    }),
    { views: 0, saves: 0, clicks: 0, ticketClicks: 0, shares: 0 }
  );

  return {
    ...totals,
    totalEvents: events.length,
    promotedEvents: events.filter((e) => e.isPromoted).length,
    activePromotions: 1,
    events: [...events].sort((a, b) => {
      if (b.views !== a.views) return b.views - a.views;
      return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    }),
    deltas: {
      totalEvents: 25,
      views: 12,
      saves: -4,
      clicks: 8,
      ticketClicks: 15,
      shares: 6,
    },
  };
}

export type MockAdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  businessAccountId?: string;
  businessType?: "venue" | "organizer";
};

export function getMockAdminUsers(): MockAdminUser[] {
  return [
    {
      id: "user-1",
      name: "Alex M.",
      email: "alex@example.com",
      role: "user",
      status: "active",
      joinedAt: "2026-01-12",
    },
    {
      id: "biz-1",
      name: "Control Club",
      email: "events@controlclub.ro",
      role: "business_venue",
      status: "approved",
      joinedAt: "2025-11-03",
      businessAccountId: "mock-business-account-1",
      businessType: "venue",
    },
    {
      id: "biz-2",
      name: "Night Collective",
      email: "hello@nightcollective.ro",
      role: "business_organizer",
      status: "pending",
      joinedAt: "2026-02-28",
      businessAccountId: "mock-business-account-2",
      businessType: "organizer",
    },
    {
      id: "user-2",
      name: "Maria D.",
      email: "maria@example.com",
      role: "user",
      status: "suspended",
      joinedAt: "2026-02-14",
    },
    {
      id: "biz-3",
      name: "Closed Venue",
      email: "closed@venue.ro",
      role: "business_venue",
      status: "suspended",
      joinedAt: "2025-09-01",
      businessAccountId: "mock-business-account-3",
      businessType: "venue",
    },
  ];
}

export function getMockSession() {
  return {
    userId: MOCK_USER_ID,
    role: "user" as const,
    email: "alex@example.com",
    displayName: "Alex",
    preferredLocale: "en" as const,
    businessAccountId: null,
    isSuspended: false,
  };
}

export function getMockBusinessSession() {
  return {
    userId: "mock-business-user",
    role: "business_venue" as const,
    email: "events@controlclub.ro",
    displayName: "Control Club",
    preferredLocale: "en" as const,
    businessAccountId: MOCK_BUSINESS_ACCOUNT_ID,
    isSuspended: false,
  };
}

export function getMockPromotions() {
  return [
    {
      id: "promo-1",
      name: "Event boost · Techno Night",
      venue: "Control Club",
      type: "event_boost",
      expiresAt: "2026-04-15",
      status: "active",
      createdAt: "2026-04-08T10:00:00.000Z",
      fulfilledAt: null as string | null,
      deliveryUrl: null as string | null,
      deliveryNotes: null as string | null,
      invoicedAt: "2026-04-08T12:00:00.000Z" as string | null,
    },
    {
      id: "promo-2",
      name: "Feed post highlight",
      venue: "Subterra",
      type: "feed_post",
      expiresAt: "2026-04-08",
      status: "active",
      createdAt: "2026-04-01T10:00:00.000Z",
      fulfilledAt: null as string | null,
      deliveryUrl: null as string | null,
      deliveryNotes: null as string | null,
      invoicedAt: null as string | null,
    },
    {
      id: "promo-3",
      name: "Newsletter feature",
      venue: "Kulturhaus",
      type: "newsletter",
      expiresAt: "2026-04-20",
      status: "scheduled",
      createdAt: "2026-04-10T10:00:00.000Z",
      fulfilledAt: null as string | null,
      deliveryUrl: null as string | null,
      deliveryNotes: null as string | null,
      invoicedAt: null as string | null,
    },
    {
      id: "promo-4",
      name: "Social media post",
      venue: "Control Club",
      type: "social_media",
      expiresAt: "2026-04-18",
      status: "active",
      createdAt: "2026-04-11T12:00:00.000Z",
      fulfilledAt: null as string | null,
      deliveryUrl: null as string | null,
      deliveryNotes: null as string | null,
      invoicedAt: null as string | null,
    },
    {
      id: "promo-5",
      name: "Social media post",
      venue: "Subterra",
      type: "social_media",
      expiresAt: "2026-04-05",
      status: "active",
      createdAt: "2026-03-29T09:00:00.000Z",
      fulfilledAt: "2026-03-30T14:00:00.000Z",
      deliveryUrl: "https://instagram.com/p/example",
      deliveryNotes: "Posted to IG Stories + feed",
      invoicedAt: "2026-03-30T15:00:00.000Z" as string | null,
    },
  ];
}

export function getMockNewsletters() {
  return [
    {
      id: "nl-1",
      subject: "This weekend in Bucharest",
      sentAt: "2026-03-28",
      recipients: 8420,
      opens: 3120,
    },
    {
      id: "nl-2",
      subject: "New venues lighting up",
      sentAt: "2026-03-21",
      recipients: 8100,
      opens: 2890,
    },
  ];
}
