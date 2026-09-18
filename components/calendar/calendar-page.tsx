"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Menu,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Nav } from "@/components/Nav";
import { DiscoveryFilterBar } from "@/components/filters/discovery-filter-bar";
import { EVENT_TYPES, formatEventTypeLabel } from "@/lib/constants/event-types";
import { dateTimeLocale } from "@/lib/i18n/date-locale";
import { landingImages } from "@/lib/landing/images";
import {
  buildEventsByDate,
  isToday,
  monthMatrix,
  toDateKey,
  updateCalendarSearchParams,
} from "@/lib/utils/calendar";
import { formatTimeRange } from "@/lib/utils/event-format";
import type { EventType, Locale } from "@/types";
import type { EventFilters, EventListItem } from "@/types/events";

type Props = {
  events: EventListItem[];
  locale: Locale;
  month: number;
  year: number;
  filters: EventFilters;
};

const WEEKDAY_KEYS = [
  "weekdayMon",
  "weekdayTue",
  "weekdayWed",
  "weekdayThu",
  "weekdayFri",
  "weekdaySat",
  "weekdaySun",
] as const;

function CalendarFilters({
  filters,
  applyEventType,
  resetFilters,
  filteredCount,
  onClose,
  eventTypeId,
}: {
  filters: EventFilters;
  applyEventType: (value: EventType | undefined) => void;
  resetFilters: () => void;
  filteredCount: number;
  onClose?: () => void;
  eventTypeId: string;
}) {
  const t = useTranslations("discovery");
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
            applyEventType(
              event.target.value
                ? (event.target.value as EventType)
                : undefined
            )
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

export function CalendarPageClient({
  events,
  locale,
  month,
  year,
  filters,
}: Props) {
  const t = useTranslations("discovery");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = new Date();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState(toDateKey(today));

  const applySearchParams = useCallback(
    (patch: {
      month?: number;
      year?: number;
      eventType?: EventType | undefined;
    }) => {
      const next = updateCalendarSearchParams(
        new URLSearchParams(searchParams.toString()),
        patch
      );
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const resetFilters = useCallback(() => {
    applySearchParams({ eventType: undefined });
  }, [applySearchParams]);

  const hasFilters = !!filters.eventType;
  const cells = useMemo(
    () => monthMatrix(year, month - 1),
    [year, month]
  );
  const eventsByDate = useMemo(() => buildEventsByDate(events), [events]);
  const selectedEvents = eventsByDate.get(selected) ?? [];
  const dtLocale = dateTimeLocale(locale);

  const monthName = new Date(year, month - 1).toLocaleDateString(dtLocale, {
    month: "long",
    year: "numeric",
  });

  const shift = (delta: number) => {
    const next = new Date(year, month - 1 + delta);
    applySearchParams({
      month: next.getMonth() + 1,
      year: next.getFullYear(),
    });
  };

  const selectedDate = new Date(`${selected}T00:00:00`);

  return (
    <main data-route="calendar" className="relative min-h-screen pb-24 md:pb-12">
      <Nav />

      <section className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 sm:pt-32">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ {t("calendarEyebrow")}
        </div>
        <h1 className="text-balance font-heading text-5xl font-bold leading-none md:text-6xl">
          {t("calendarTitle")}{" "}
          <span className="text-gradient-firefly">{t("calendarTitleAccent")}</span>
        </h1>

        <div className="mt-8 lg:hidden">
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
              <CalendarFilters
                filters={filters}
                applyEventType={(value) =>
                  applySearchParams({ eventType: value })
                }
                resetFilters={resetFilters}
                filteredCount={events.length}
                eventTypeId="calendar-event-type-mobile"
                onClose={() => setFiltersOpen(false)}
              />
            </aside>
          ) : null}
        </div>

        <div className="mt-8 hidden lg:block">
          <DiscoveryFilterBar
            locale={locale}
            eventType={filters.eventType}
            onEventTypeChange={(value) =>
              applySearchParams({ eventType: value })
            }
            hasActiveFilters={hasFilters}
            onReset={resetFilters}
          />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <div className="min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-2xl">{monthName}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    applySearchParams({
                      month: today.getMonth() + 1,
                      year: today.getFullYear(),
                    });
                    setSelected(toDateKey(today));
                  }}
                  className="rounded-full border border-firefly/30 px-3 py-1.5 font-mono text-xs uppercase tracking-wider-2 text-firefly transition-colors hover:bg-firefly/10"
                >
                  {t("today")}
                </button>
                <button
                  type="button"
                  onClick={() => shift(-1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-firefly/20 transition-colors hover:border-firefly/50"
                  aria-label={t("prevMonth")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => shift(1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-firefly/20 transition-colors hover:border-firefly/50"
                  aria-label={t("nextMonth")}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 sm:mb-3 sm:gap-2">
              {WEEKDAY_KEYS.map((weekday) => (
                <div
                  key={weekday}
                  className="text-center font-mono text-[9px] uppercase tracking-wider-2 text-foreground/40 sm:text-[10px]"
                >
                  {t(weekday)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {cells.map((date, index) => {
                if (!date) return <div key={index} />;

                const key = toDateKey(date);
                const dayEvents = eventsByDate.get(key) ?? [];
                const isSelected = key === selected;
                const todayCell = isToday(key, today);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelected(key)}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-all sm:rounded-xl sm:text-sm ${
                      isSelected
                        ? "border border-firefly bg-firefly/15 text-firefly"
                        : "border border-firefly/10 bg-surface-1/40 hover:border-firefly/30"
                    } ${todayCell && !isSelected ? "ring-1 ring-firefly/50" : ""}`}
                  >
                    <span
                      className={
                        todayCell
                          ? "font-semibold text-firefly"
                          : "text-foreground/80"
                      }
                    >
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 ? (
                      <div className="absolute bottom-1.5 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((_, dotIndex) => (
                          <span
                            key={dotIndex}
                            className="h-1 w-1 animate-firefly-pulse rounded-full bg-firefly"
                            style={{
                              animationDelay: `${dotIndex * 0.3}s`,
                              boxShadow: "0 0 6px #FEF7A3",
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="glass min-w-0 w-full self-start rounded-3xl p-6">
            <div className="mb-2 font-mono text-xs uppercase tracking-wider-2 text-firefly">
              {selectedDate.toLocaleDateString(dtLocale, { weekday: "long" })}
            </div>
            <h2 className="mb-6 font-heading text-3xl font-bold">
              {selectedDate.toLocaleDateString(dtLocale, {
                day: "numeric",
                month: "long",
              })}
            </h2>

            {selectedEvents.length === 0 ? (
              <div className="text-sm text-foreground/50">
                {t("calendarEmpty")}
              </div>
            ) : (
              <ul className="space-y-3">
                {selectedEvents.map((event) => {
                  const image =
                    event.coverImageUrl ?? landingImages.editorialCrowd;

                  return (
                    <li key={event.id} className="min-w-0 w-full">
                      <Link
                        href={`/events/${event.slug}`}
                        className="group flex min-w-0 w-full gap-3 rounded-2xl border-l-2 border-firefly bg-surface-2/50 p-3 transition-colors hover:bg-firefly/10"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={image}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-heading font-semibold transition-colors group-hover:text-firefly">
                            {event.title}
                          </div>
                          <div className="mt-1 flex min-w-0 items-center gap-1 text-xs text-foreground/55">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="min-w-0 truncate">{event.venueName}</span>
                          </div>
                          <div className="mt-1 flex min-w-0 items-center gap-1 font-mono text-xs text-firefly">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span className="min-w-0 truncate">
                              {formatTimeRange(event.startsAt, event.endsAt, locale)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
