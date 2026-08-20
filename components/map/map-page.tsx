"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Clock, MapPin, Menu, Search, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Nav } from "@/components/Nav";
import { useSavedEvents } from "@/hooks/use-saved-events";
import { EVENT_TYPES, formatEventTypeLabel } from "@/lib/constants/event-types";
import { formatGenreLabel, GENRES } from "@/lib/constants/genres";
import { landingImages } from "@/lib/landing/images";
import {
  BUCHAREST_BOUNDS_LNG_LAT,
  BUCHAREST_CENTER,
  MAP_STYLE_URL,
} from "@/lib/utils/map-coords";
import {
  filterMapEvents,
  type DateFilter,
} from "@/lib/utils/map-filters";
import { formatDateBadge, formatTime } from "@/lib/utils/event-format";
import type { EventType, Genre } from "@/types";
import type { EventListItem } from "@/types/events";

type Props = {
  events: EventListItem[];
};

const DATE_FILTERS = [
  ["any", "Any time"],
  ["tonight", "Tonight"],
  ["tomorrow", "Tomorrow"],
  ["weekend", "Weekend"],
] as const satisfies ReadonlyArray<[DateFilter, string]>;

function MapFilters({
  query,
  setQuery,
  date,
  setDate,
  genres,
  toggleGenre,
  eventTypes,
  toggleEventType,
  filteredCount,
  resetFilters,
  onClose,
}: {
  query: string;
  setQuery: (value: string) => void;
  date: DateFilter;
  setDate: (value: DateFilter) => void;
  genres: Set<Genre>;
  toggleGenre: (genre: Genre) => void;
  eventTypes: Set<EventType>;
  toggleEventType: (type: EventType) => void;
  filteredCount: number;
  resetFilters: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ Tune the night
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-firefly/20 transition-colors hover:border-firefly/50"
            aria-label="Close filters"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search venues, parties…"
          className="w-full rounded-xl border border-firefly/10 bg-surface-2/60 py-3 pl-10 pr-3 text-sm transition-colors placeholder:text-foreground/40 focus:border-firefly/50 focus:outline-none"
        />
      </div>

      <div className="mb-5">
        <div className="mb-2 font-mono text-xs uppercase tracking-wider text-foreground/50">
          When
        </div>
        <div className="flex flex-wrap gap-2">
          {DATE_FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDate(key)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                date === key
                  ? "border-firefly bg-firefly text-primary-foreground firefly-glow"
                  : "border-firefly/20 text-foreground/70 hover:border-firefly/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-2 font-mono text-xs uppercase tracking-wider text-foreground/50">
          Genre
        </div>
        <div className="grid grid-cols-2 gap-2">
          {GENRES.map((genre) => {
            const on = genres.has(genre);

            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                  on
                    ? "border-firefly/60 bg-firefly/10 text-firefly"
                    : "border-firefly/10 bg-surface-2/40 text-foreground/70 hover:border-firefly/30"
                }`}
              >
                {formatGenreLabel(genre)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-2 font-mono text-xs uppercase tracking-wider text-foreground/50">
          Event type
        </div>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_TYPES.map((type) => {
            const on = eventTypes.has(type);

            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleEventType(type)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                  on
                    ? "border-firefly/60 bg-firefly/10 text-firefly"
                    : "border-firefly/10 bg-surface-2/40 text-foreground/70 hover:border-firefly/30"
                }`}
              >
                {formatEventTypeLabel(type)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-firefly/10 pt-4">
        <div className="text-sm text-foreground/60">
          <span className="font-medium text-firefly">{filteredCount}</span> events
          glowing
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="font-mono text-xs uppercase tracking-wider-2 text-foreground/50 transition-colors hover:text-firefly"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function styleFireflyPin(
  span: HTMLElement,
  event: EventListItem,
  index: number,
  isActive: boolean
) {
  const size = event.isPromoted ? 22 : 14;
  span.style.width = `${size}px`;
  span.style.height = `${size}px`;
  span.style.animationDelay = `${index * 0.2}s`;
  span.style.background = event.isPromoted
    ? "radial-gradient(circle, #FEF7A3 0%, #E89A5F 100%)"
    : "#FEF7A3";
  span.style.boxShadow = `0 0 ${size * 1.6}px #FEF7A3, 0 0 ${size * 4}px rgba(254,247,163,${event.isPromoted ? 0.7 : 0.5})`;
  span.style.outline = isActive ? "2px solid rgba(254,247,163,0.9)" : "none";
  span.style.outlineOffset = "4px";
}

function MapCanvas({
  filtered,
  activeId,
  setActiveId,
  active,
  has,
  toggle,
  className,
  activeCardClassName,
}: {
  filtered: EventListItem[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  active: EventListItem | null;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  className?: string;
  activeCardClassName: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const activeIdRef = useRef(activeId);
  const setActiveIdRef = useRef(setActiveId);

  activeIdRef.current = activeId;
  setActiveIdRef.current = setActiveId;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE_URL,
      center: [BUCHAREST_CENTER.lng, BUCHAREST_CENTER.lat],
      zoom: 12.5,
      attributionControl: { compact: true },
    });

    map.fitBounds(BUCHAREST_BOUNDS_LNG_LAT, { padding: 48, duration: 0 });
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      for (const marker of markersRef.current.values()) {
        marker.remove();
      }
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncMarkers = () => {
      const nextIds = new Set(filtered.map((event) => event.id));

      for (const [id, marker] of markersRef.current) {
        if (!nextIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }

      filtered.forEach((event, index) => {
        const isActive = activeIdRef.current === event.id;
        let marker = markersRef.current.get(event.id);

        if (!marker) {
          const button = document.createElement("button");
          button.type = "button";
          button.setAttribute("aria-label", event.title);
          // Do not apply CSS transforms on the marker root — MapLibre
          // positions markers via transform, and hover:scale would replace it
          // and teleport the pin (looks like a duplicate point).
          button.style.background = "transparent";
          button.style.border = "none";
          button.style.padding = "0";
          button.style.cursor = "pointer";

          const hit = document.createElement("span");
          hit.className = "block transition-transform hover:scale-125";

          const span = document.createElement("span");
          span.className = "firefly-pin block animate-firefly-pulse rounded-full";
          hit.appendChild(span);
          button.appendChild(hit);

          button.addEventListener("click", (clickEvent) => {
            clickEvent.stopPropagation();
            const current = activeIdRef.current;
            setActiveIdRef.current(current === event.id ? null : event.id);
          });

          marker = new maplibregl.Marker({ element: button, anchor: "center" })
            .setLngLat([event.lng, event.lat])
            .addTo(map);
          markersRef.current.set(event.id, marker);
        } else {
          marker.setLngLat([event.lng, event.lat]);
        }

        const span = marker.getElement().querySelector(".firefly-pin");
        if (span instanceof HTMLElement) {
          styleFireflyPin(span, event, index, isActive);
        }
      });
    };

    if (map.loaded()) {
      syncMarkers();
      return;
    }

    map.once("load", syncMarkers);
    return () => {
      map.off("load", syncMarkers);
    };
  }, [filtered, activeId]);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-firefly/10 ${className ?? ""}`}
      style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/25" />

      {active ? (
        <div
          className={`glass absolute z-10 animate-fade-up overflow-hidden rounded-2xl ${activeCardClassName}`}
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
        >
          <button
            type="button"
            onClick={() => setActiveId(null)}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 backdrop-blur transition-colors hover:bg-firefly/20"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative h-32 overflow-hidden">
            <Image
              src={active.coverImageUrl ?? landingImages.editorialCrowd}
              alt=""
              fill
              sizes="384px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
              <span>{formatDateBadge(active.startsAt)}</span>
              <span className="text-foreground/30">·</span>
              <Clock className="h-3 w-3" />
              <span>{formatTime(active.startsAt)}</span>
            </div>
            <h3 className="mt-1 font-heading text-xl font-bold leading-tight">
              {active.title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-foreground/60">
              <MapPin className="h-3 w-3" />
              {active.venueName}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href={`/events/${active.slug}`}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-firefly px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:firefly-glow"
              >
                View details
              </Link>
              <button
                type="button"
                onClick={() => toggle(active.id)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-firefly/40 text-firefly transition-colors hover:bg-firefly/10"
                aria-label="Save"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={has(active.id) ? "#FEF7A3" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MapPageClient({ events }: Props) {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState<DateFilter>("any");
  const [genres, setGenres] = useState<Set<Genre>>(new Set());
  const [eventTypes, setEventTypes] = useState<Set<EventType>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { has, toggle } = useSavedEvents();

  const filtered = useMemo(
    () => filterMapEvents(events, { query, date, genres, eventTypes }),
    [events, query, date, genres, eventTypes]
  );

  const active = activeId
    ? (filtered.find((event) => event.id === activeId) ?? null)
    : null;

  const hasActiveFilters =
    query.length > 0 ||
    date !== "any" ||
    genres.size > 0 ||
    eventTypes.size > 0;

  const toggleGenre = (genre: Genre) => {
    setGenres((current) => {
      const next = new Set(current);
      if (next.has(genre)) next.delete(genre);
      else next.add(genre);
      return next;
    });
  };

  const toggleEventType = (type: EventType) => {
    setEventTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const resetFilters = () => {
    setQuery("");
    setDate("any");
    setGenres(new Set());
    setEventTypes(new Set());
    setActiveId(null);
  };

  const filterProps = {
    query,
    setQuery,
    date,
    setDate,
    genres,
    toggleGenre,
    eventTypes,
    toggleEventType,
    filteredCount: filtered.length,
    resetFilters,
  };

  const mapCanvasProps = {
    filtered,
    activeId,
    setActiveId,
    active,
    has,
    toggle,
  };

  return (
    <main data-route="map" className="relative min-h-[100dvh] pb-24 lg:pb-0">
      <Nav />

      {/* Desktop: sidebar + map grid */}
      <div className="mx-auto hidden max-w-[1600px] px-4 pt-24 md:px-6 lg:block">
        <div className="grid gap-4 lg:grid-cols-[340px_1fr] lg:gap-6">
          <aside className="glass max-h-[calc(100vh-7rem)] self-start overflow-y-auto rounded-3xl p-5 lg:sticky lg:top-24">
            <MapFilters {...filterProps} />
          </aside>

          <div className="relative">
            <MapCanvas
              {...mapCanvasProps}
              className="aspect-[16/10] lg:aspect-auto lg:h-[calc(100vh-7rem)]"
              activeCardClassName="bottom-5 left-5 right-5 md:right-auto md:max-w-sm"
            />
          </div>
        </div>
      </div>

      {/* Mobile: filters above map (toggle), below fixed nav */}
      <div className="fixed inset-x-0 top-20 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-0 mx-auto flex max-w-[1600px] flex-col overflow-hidden px-4 lg:hidden">
        <div className="flex shrink-0 items-center gap-2 py-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors hover:bg-surface-1/80"
            aria-expanded={filtersOpen}
            aria-label={filtersOpen ? "Hide filters" : "Show filters"}
          >
            <Menu className="h-4 w-4 text-firefly" />
            <span className="font-mono text-[11px] uppercase tracking-wider-2">
              Filters
            </span>
            {hasActiveFilters ? (
              <span className="h-2 w-2 rounded-full bg-firefly" />
            ) : null}
          </button>
          <span className="font-mono text-[10px] uppercase tracking-wider-2 text-foreground/50">
            <span className="font-medium text-firefly">{filtered.length}</span>
            <span className="ml-1.5">glowing</span>
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {filtersOpen ? (
            <aside className="glass mb-3 shrink-0 rounded-2xl p-4 animate-fade-up">
              <MapFilters
                {...filterProps}
                onClose={() => setFiltersOpen(false)}
              />
            </aside>
          ) : null}

          <div className="h-full shrink-0">
            <MapCanvas
              {...mapCanvasProps}
              className="h-full"
              activeCardClassName="bottom-4 left-4 right-4"
            />
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
