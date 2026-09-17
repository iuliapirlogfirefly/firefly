"use client";

import { useCallback, useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { EventCard } from "@/components/EventCard";
import { Nav } from "@/components/Nav";
import { DiscoveryFilterBar } from "@/components/filters/discovery-filter-bar";
import {
  EVENT_TYPES,
  formatEventTypeLabel,
} from "@/lib/constants/event-types";
import { formatGenreLabel, GENRES } from "@/lib/constants/genres";
import {
  hasActiveEventFilters,
  updateFeedSearchParams,
} from "@/lib/utils/feed-filters";
import type { DatePreset, EventType, Genre, Locale } from "@/types";
import type { EventFilters, EventListItem } from "@/types/events";

type Props = {
  events: EventListItem[];
  locale: Locale;
  filters: EventFilters;
};

const BUCHAREST_CENTER = { lat: 44.4268, lng: 26.1025 };

const DATE_PRESETS = [
  "tonight",
  "tomorrow",
  "this_weekend",
  "this_week",
  "custom",
] as const satisfies ReadonlyArray<DatePreset>;

const DATE_PRESET_MESSAGE = {
  tonight: "tonight",
  tomorrow: "tomorrow",
  this_weekend: "thisWeekend",
  this_week: "thisWeek",
  custom: "custom",
} as const;

const DISTANCE_OPTIONS = [null, 2, 5, 10] as const;

const CLEARED_FILTERS: Partial<EventFilters> = {
  genre: undefined,
  eventType: undefined,
  datePreset: undefined,
  customDate: undefined,
  search: undefined,
  promotedOnly: undefined,
  distanceKm: undefined,
  lat: undefined,
  lng: undefined,
};

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

function FeedFilters({
  filters,
  searchDraft,
  setSearchDraft,
  applyFilters,
  setDistance,
  distanceLabel,
  filteredCount,
  resetFilters,
  onClose,
  eventTypeId,
}: {
  filters: EventFilters;
  searchDraft: string;
  setSearchDraft: (value: string) => void;
  applyFilters: (patch: Partial<EventFilters>) => void;
  setDistance: (distanceKm: number | null) => void;
  distanceLabel: string | null;
  filteredCount: number;
  resetFilters: () => void;
  onClose?: () => void;
  eventTypeId: string;
}) {
  const t = useTranslations("discovery");
  const tGenres = useTranslations("genres");
  const tTypes = useTranslations("eventTypes");

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ {t("tuneNight")}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-firefly/20 transition-colors hover:border-firefly/50"
            aria-label={t("closeFilters")}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
        <input
          type="search"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-xl border border-firefly/10 bg-surface-2/60 py-3 pl-10 pr-3 text-sm transition-colors placeholder:text-foreground/40 focus:border-firefly/50 focus:outline-none"
        />
      </div>

      <div className="mb-5">
        <div className="mb-2 font-mono text-xs uppercase tracking-wider text-foreground/50">
          {t("when")}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              applyFilters({ datePreset: undefined, customDate: undefined })
            }
            className={`rounded-full border px-3 py-1.5 text-xs transition-all ${pillClass(!filters.datePreset)}`}
          >
            {t("anyTime")}
          </button>
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => applyFilters({ datePreset: preset })}
              className={`rounded-full border px-3 py-1.5 text-xs transition-all ${pillClass(filters.datePreset === preset)}`}
            >
              {t(DATE_PRESET_MESSAGE[preset])}
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

      <div className="mb-5">
        <div className="mb-2 font-mono text-xs uppercase tracking-wider text-foreground/50">
          {t("genre")}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => applyFilters({ genre: undefined })}
            className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
              !filters.genre
                ? "border-firefly/60 bg-firefly/10 text-firefly"
                : "border-firefly/10 bg-surface-2/40 text-foreground/70 hover:border-firefly/30"
            }`}
          >
            {t("all")}
          </button>
          {GENRES.map((genre) => {
            const on = filters.genre === genre;

            return (
              <button
                key={genre}
                type="button"
                onClick={() => applyFilters({ genre })}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                  on
                    ? "border-firefly/60 bg-firefly/10 text-firefly"
                    : "border-firefly/10 bg-surface-2/40 text-foreground/70 hover:border-firefly/30"
                }`}
              >
                {formatGenreLabel(genre, tGenres)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5">
        <label
          htmlFor={eventTypeId}
          className="mb-2 block font-mono text-xs uppercase tracking-wider text-foreground/50"
        >
          {t("eventType")}
        </label>
        <select
          id={eventTypeId}
          value={filters.eventType ?? ""}
          onChange={(event) =>
            applyFilters({
              eventType: event.target.value
                ? (event.target.value as EventType)
                : undefined,
            })
          }
          className="w-full rounded-xl border border-firefly/10 bg-surface-2/60 px-3 py-2 text-sm focus:border-firefly/50 focus:outline-none"
        >
          <option value="">{t("allTypes")}</option>
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatEventTypeLabel(type, tTypes)}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-5">
        <div className="mb-2 font-mono text-xs uppercase tracking-wider text-foreground/50">
          {t("distance")}
        </div>
        <div className="flex flex-wrap gap-2">
          {DISTANCE_OPTIONS.map((km) => (
            <button
              key={km ?? "off"}
              type="button"
              onClick={() => void setDistance(km)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-all ${pillClass(
                km == null
                  ? filters.distanceKm == null
                  : filters.distanceKm === km
              )}`}
            >
              {km == null ? t("off") : t("km", { km })}
            </button>
          ))}
        </div>
        {distanceLabel ? (
          <p className="mt-1.5 text-xs text-foreground/50">{distanceLabel}</p>
        ) : null}
      </div>

      <div className="mb-5">
        <button
          type="button"
          onClick={() =>
            applyFilters({
              promotedOnly: filters.promotedOnly ? undefined : true,
            })
          }
          className={`rounded-full border px-4 py-2 text-sm transition-all ${pillClass(!!filters.promotedOnly)}`}
        >
          {t("promotedOnly")}
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-firefly/10 pt-4">
        <div className="text-sm text-foreground/60">
          {t("eventsGlowing", { count: filteredCount })}
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="font-mono text-xs uppercase tracking-wider-2 text-foreground/50 transition-colors hover:text-firefly"
        >
          {t("reset")}
        </button>
      </div>
    </div>
  );
}

function FeedEventSection({
  eyebrow,
  title,
  events,
}: {
  eyebrow: string;
  title: string;
  events: EventListItem[];
}) {
  if (events.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
        ◦ {eyebrow}
      </div>
      <h2 className="mb-6 font-heading text-3xl font-bold md:text-4xl">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

export function FeedPageClient({ events, locale, filters }: Props) {
  const t = useTranslations("discovery");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const resetFilters = useCallback(() => {
    setSearchDraft("");
    applyFilters(CLEARED_FILTERS);
  }, [applyFilters]);

  const hasFilters = hasActiveEventFilters(filters);
  const hottest = events.filter((event) => event.isPromoted);
  const rest = events.filter((event) => !event.isPromoted);
  const distanceHint =
    filters.distanceKm != null
      ? isBucharestFallback(filters.lat, filters.lng)
        ? t("nearBucharest")
        : t("nearYou")
      : null;

  return (
    <main data-route="feed" className="relative min-h-screen pb-24 md:pb-12">
      <Nav />

      <section className="mx-auto max-w-7xl px-6 pt-32">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ {t("feedEyebrow")}
        </div>
        <h1 className="text-balance font-heading text-5xl font-bold leading-[0.95] md:text-7xl">
          {t("feedTitle")}
          <br />{" "}
          <span className="text-gradient-firefly">{t("feedTitleAccent")}</span>
        </h1>
        <p className="mt-6 max-w-xl text-foreground/65">{t("feedSubtitle")}</p>

        <div className="mt-10 lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors hover:bg-surface-1/80"
              aria-expanded={filtersOpen}
              aria-label={filtersOpen ? t("hideFilters") : t("showFilters")}
            >
              <Menu className="h-4 w-4 text-firefly" />
              <span className="font-mono text-[11px] uppercase tracking-wider-2">
                {t("filters")}
              </span>
              {hasFilters ? (
                <span className="h-2 w-2 rounded-full bg-firefly" />
              ) : null}
            </button>
            <span className="font-mono text-[10px] uppercase tracking-wider-2 text-foreground/50">
              <span className="font-medium text-firefly">{events.length}</span>
              <span className="ml-1.5">{t("glowing")}</span>
            </span>
          </div>

          {filtersOpen ? (
            <aside className="glass mt-3 rounded-2xl p-4 animate-fade-up">
              <FeedFilters
                filters={filters}
                searchDraft={searchDraft}
                setSearchDraft={setSearchDraft}
                applyFilters={applyFilters}
                setDistance={setDistance}
                distanceLabel={distanceHint}
                filteredCount={events.length}
                resetFilters={resetFilters}
                eventTypeId="feed-event-type-mobile"
                onClose={() => setFiltersOpen(false)}
              />
            </aside>
          ) : null}
        </div>

        <div className="mt-10 hidden lg:block">
          <DiscoveryFilterBar
            locale={locale}
            searchDraft={searchDraft}
            onSearchDraftChange={setSearchDraft}
            eventType={filters.eventType}
            onEventTypeChange={(value: EventType | undefined) =>
              applyFilters({ eventType: value })
            }
            datePreset={filters.datePreset}
            customDate={filters.customDate}
            onDateChange={({ datePreset, customDate }) =>
              applyFilters({ datePreset, customDate })
            }
            genre={filters.genre}
            onGenreChange={(value: Genre | undefined) =>
              applyFilters({ genre: value })
            }
            distanceKm={filters.distanceKm}
            onDistanceChange={(value) => void setDistance(value)}
            distanceHint={distanceHint}
            promotedOnly={filters.promotedOnly}
            onPromotedChange={(value) => applyFilters({ promotedOnly: value })}
            filteredCount={events.length}
            hasActiveFilters={hasFilters}
            onReset={resetFilters}
          />
        </div>

        <FeedEventSection
          eyebrow={t("promotedEyebrow")}
          title={t("promotedTitle")}
          events={hottest}
        />

        <FeedEventSection
          eyebrow={t("dontMissEyebrow")}
          title={t("dontMissTitle")}
          events={rest}
        />

        {events.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-firefly-pulse rounded-full border border-firefly/30 bg-firefly/10" />
            <p className="text-foreground/60">
              {hasFilters ? t("feedEmptyFiltered") : t("feedEmpty")}
            </p>
          </div>
        ) : null}
      </section>

      <BottomNav />
    </main>
  );
}
