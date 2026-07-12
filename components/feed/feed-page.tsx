"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { EventCard } from "@/components/EventCard";
import { Nav } from "@/components/Nav";
import {
  EVENT_TYPES,
  formatEventTypeLabel,
} from "@/lib/constants/event-types";
import { formatGenreLabel, GENRES } from "@/lib/constants/genres";
import {
  hasActiveEventFilters,
  updateFeedSearchParams,
} from "@/lib/utils/feed-filters";
import type { DatePreset, EventType, Locale } from "@/types";
import type { EventFilters, EventListItem } from "@/types/events";

type Props = {
  events: EventListItem[];
  weekEvents: EventListItem[];
  locale: Locale;
  filters: EventFilters;
};

const BUCHAREST_CENTER = { lat: 44.4268, lng: 26.1025 };

const DATE_PRESETS = [
  ["tonight", "Tonight"],
  ["tomorrow", "Tomorrow"],
  ["this_weekend", "This Weekend"],
  ["this_week", "This Week"],
  ["custom", "Custom"],
] as const satisfies ReadonlyArray<[DatePreset, string]>;

const DISTANCE_OPTIONS = [
  [null, "Off"],
  [2, "2 km"],
  [5, "5 km"],
  [10, "10 km"],
] as const;

function pillClass(active: boolean) {
  return active
    ? "border-firefly bg-firefly text-primary-foreground firefly-glow"
    : "border-firefly/20 text-foreground/70 hover:border-firefly/50";
}

function isBucharestFallback(lat?: number, lng?: number) {
  if (lat == null || lng == null) return true;
  return (
    Math.abs(lat - BUCHAREST_CENTER.lat) < 0.001 &&
    Math.abs(lng - BUCHAREST_CENTER.lng) < 0.001
  );
}

function requestLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => reject(new Error("denied")),
      { enableHighAccuracy: false, timeout: 10_000 }
    );
  });
}

export function FeedPageClient({ events, weekEvents, locale, filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");

  useEffect(() => {
    setSearchDraft(filters.search ?? "");
  }, [filters.search]);

  const applyFilters = useCallback(
    (patch: Partial<EventFilters>) => {
      const next = updateFeedSearchParams(
        new URLSearchParams(searchParams.toString()),
        patch
      );
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const trimmed = searchDraft.trim();
      if (trimmed === (filters.search ?? "")) return;
      applyFilters({ search: trimmed || undefined });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchDraft, filters.search, applyFilters]);

  const setDistance = useCallback(
    async (distanceKm: number | null) => {
      if (!distanceKm) {
        applyFilters({ distanceKm: undefined, lat: undefined, lng: undefined });
        return;
      }

      try {
        const { lat, lng } = await requestLocation();
        applyFilters({ distanceKm, lat, lng });
      } catch {
        applyFilters({
          distanceKm,
          lat: BUCHAREST_CENTER.lat,
          lng: BUCHAREST_CENTER.lng,
        });
      }
    },
    [applyFilters]
  );

  const hasFilters = hasActiveEventFilters(filters);
  const showWeekSection = !filters.datePreset && weekEvents.length > 0;
  const weekEventIds = new Set(weekEvents.map((event) => event.id));
  const mainEvents = showWeekSection
    ? events.filter((event) => !weekEventIds.has(event.id))
    : events;
  const distanceLabel =
    filters.distanceKm != null
      ? isBucharestFallback(filters.lat, filters.lng)
        ? locale === "ro"
          ? "Lângă București"
          : "Near Bucharest"
        : locale === "ro"
          ? "Lângă tine"
          : "Near you"
      : null;

  return (
    <main data-route="feed" className="relative min-h-screen pb-24 md:pb-12">
      <Nav />

      <section className="mx-auto max-w-7xl px-6 pt-32">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ {locale === "ro" ? "Feed" : "The feed"}
        </div>
        <h1 className="text-balance font-heading text-5xl font-bold leading-[0.95] md:text-7xl">
          Tonight, tomorrow,
          <br />{" "}
          <span className="text-gradient-firefly">and beyond.</span>
        </h1>
        <p className="mt-6 max-w-xl text-foreground/65">
          {locale === "ro"
            ? "Toate petrecerile care strălucesc pe hartă — atinge pentru detalii."
            : "Every party glowing on the map — tap for details."}
        </p>

        <div className="relative mt-10">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder={
              locale === "ro"
                ? "Caută locații, petreceri…"
                : "Search venues, parties…"
            }
            className="w-full rounded-xl border border-firefly/10 bg-surface-2/60 py-3 pl-10 pr-3 text-sm transition-colors placeholder:text-foreground/40 focus:border-firefly/50 focus:outline-none"
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 font-mono text-xs uppercase tracking-wider text-foreground/50">
            {locale === "ro" ? "Când" : "When"}
          </div>
          <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() =>
                applyFilters({ datePreset: undefined, customDate: undefined })
              }
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all ${pillClass(!filters.datePreset)}`}
            >
              {locale === "ro" ? "Oricând" : "Any time"}
            </button>
            {DATE_PRESETS.map(([preset, label]) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyFilters({ datePreset: preset })}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all ${pillClass(filters.datePreset === preset)}`}
              >
                {label}
              </button>
            ))}
          </div>
          {filters.datePreset === "custom" ? (
            <input
              type="date"
              value={filters.customDate ?? ""}
              onChange={(event) =>
                applyFilters({
                  datePreset: "custom",
                  customDate: event.target.value || undefined,
                })
              }
              className="mt-3 rounded-xl border border-firefly/10 bg-surface-2/60 px-3 py-2 text-sm focus:border-firefly/50 focus:outline-none"
            />
          ) : null}
        </div>

        <div className="mt-6">
          <div className="mb-2 font-mono text-xs uppercase tracking-wider text-foreground/50">
            Genre
          </div>
          <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => applyFilters({ genre: undefined })}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all ${pillClass(!filters.genre)}`}
            >
              All
            </button>
            {GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => applyFilters({ genre })}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all ${pillClass(filters.genre === genre)}`}
              >
                {formatGenreLabel(genre)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div>
            <label
              htmlFor="feed-event-type"
              className="mb-2 block font-mono text-xs uppercase tracking-wider text-foreground/50"
            >
              {locale === "ro" ? "Tip eveniment" : "Event type"}
            </label>
            <select
              id="feed-event-type"
              value={filters.eventType ?? ""}
              onChange={(event) =>
                applyFilters({
                  eventType: event.target.value
                    ? (event.target.value as EventType)
                    : undefined,
                })
              }
              className="rounded-xl border border-firefly/10 bg-surface-2/60 px-3 py-2 text-sm focus:border-firefly/50 focus:outline-none"
            >
              <option value="">
                {locale === "ro" ? "Toate tipurile" : "All types"}
              </option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatEventTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-2 font-mono text-xs uppercase tracking-wider text-foreground/50">
              {locale === "ro" ? "Distanță" : "Distance"}
            </div>
            <div className="flex flex-wrap gap-2">
              {DISTANCE_OPTIONS.map(([km, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => void setDistance(km)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all ${pillClass(
                    km == null
                      ? filters.distanceKm == null
                      : filters.distanceKm === km
                  )}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {distanceLabel ? (
              <p className="mt-1.5 text-xs text-foreground/50">{distanceLabel}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() =>
              applyFilters({ promotedOnly: filters.promotedOnly ? undefined : true })
            }
            className={`rounded-full border px-4 py-2 text-sm transition-all ${pillClass(!!filters.promotedOnly)}`}
          >
            {locale === "ro" ? "Doar promovate" : "Promoted only"}
          </button>
        </div>

        {showWeekSection ? (
          <section className="mt-10">
            <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
              ◦ {locale === "ro" ? "Petreceri săptămâna asta" : "Parties this week"}
            </div>
            <h2 className="mb-6 font-heading text-3xl font-bold md:text-4xl">
              {locale === "ro"
                ? "Nopțile care strălucesc până duminică"
                : "The nights glowing through Sunday"}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {weekEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mainEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {mainEvents.length === 0 && !showWeekSection ? (
          <div className="mt-20 text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-firefly-pulse rounded-full border border-firefly/30 bg-firefly/10" />
            <p className="text-foreground/60">
              {hasFilters
                ? locale === "ro"
                  ? "Nicio petrecere nu se potrivește filtrelor tale… încă."
                  : "No parties match your filters… yet."
                : locale === "ro"
                  ? "Nicio petrecere… încă."
                  : "No parties… yet."}
            </p>
          </div>
        ) : null}
      </section>

      <BottomNav />
    </main>
  );
}
