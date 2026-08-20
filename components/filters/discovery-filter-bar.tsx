"use client";

import { FilterChip } from "@/components/filters/filter-chip";
import {
  FilterDropdown,
  FilterMenuProvider,
} from "@/components/filters/filter-menu";
import { FilterOptions } from "@/components/filters/filter-options";
import { FilterSearch } from "@/components/filters/filter-search";
import { MiniDatePicker } from "@/components/filters/mini-date-picker";
import {
  EVENT_TYPES,
  formatEventTypeLabel,
} from "@/lib/constants/event-types";
import { formatGenreLabel, GENRES } from "@/lib/constants/genres";
import type { DatePreset, EventType, Genre, Locale } from "@/types";

const DATE_PRESETS = [
  "tonight",
  "tomorrow",
  "this_weekend",
  "this_week",
] as const satisfies ReadonlyArray<Exclude<DatePreset, "custom">>;

const DISTANCE_OPTIONS = [2, 5, 10] as const;

function datePresetLabel(preset: DatePreset, locale: Locale): string {
  if (locale === "ro") {
    switch (preset) {
      case "tonight":
        return "Diseară";
      case "tomorrow":
        return "Mâine";
      case "this_weekend":
        return "Weekendul ăsta";
      case "this_week":
        return "Săptămâna asta";
      case "custom":
        return "Personalizat";
    }
  }

  switch (preset) {
    case "tonight":
      return "Tonight";
    case "tomorrow":
      return "Tomorrow";
    case "this_weekend":
      return "This weekend";
    case "this_week":
      return "This week";
    case "custom":
      return "Custom";
  }
}

function formatCustomDate(dateKey: string, locale: Locale): string {
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return parsed.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB", {
    day: "numeric",
    month: "short",
  });
}

function whenValueLabel(
  datePreset: DatePreset | undefined,
  customDate: string | undefined,
  locale: Locale
): string | undefined {
  if (datePreset === "custom" && customDate) {
    return formatCustomDate(customDate, locale);
  }
  if (datePreset && datePreset !== "custom") {
    return datePresetLabel(datePreset, locale);
  }
  return undefined;
}

export type DiscoveryFilterBarProps = {
  locale: Locale;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  eventType?: EventType;
  onEventTypeChange: (value: EventType | undefined) => void;
  datePreset?: DatePreset;
  customDate?: string;
  onDateChange?: (patch: {
    datePreset: DatePreset | undefined;
    customDate: string | undefined;
  }) => void;
  genre?: Genre;
  onGenreChange?: (value: Genre | undefined) => void;
  distanceKm?: number;
  onDistanceChange?: (value: number | null) => void;
  distanceHint?: string | null;
  promotedOnly?: boolean;
  onPromotedChange?: (value: boolean | undefined) => void;
  filteredCount?: number;
  hasActiveFilters?: boolean;
  onReset?: () => void;
};

export function DiscoveryFilterBar({
  locale,
  searchDraft,
  onSearchDraftChange,
  eventType,
  onEventTypeChange,
  datePreset,
  customDate,
  onDateChange,
  genre,
  onGenreChange,
  distanceKm,
  onDistanceChange,
  distanceHint,
  promotedOnly,
  onPromotedChange,
  filteredCount,
  hasActiveFilters,
  onReset,
}: DiscoveryFilterBarProps) {
  const showWhen = Boolean(onDateChange);
  const showGenre = Boolean(onGenreChange);
  const showDistance = Boolean(onDistanceChange);
  const showPromoted = Boolean(onPromotedChange);
  const showMeta = filteredCount != null || Boolean(onReset);

  const whenLabel = locale === "ro" ? "Când" : "When";
  const typeLabel = locale === "ro" ? "Tip" : "Type";
  const genreLabel = locale === "ro" ? "Gen" : "Genre";
  const nearLabel = locale === "ro" ? "Aproape" : "Near";
  const allLabel = locale === "ro" ? "Toate" : "All";
  const anyTimeLabel = locale === "ro" ? "Oricând" : "Any time";
  const offLabel = locale === "ro" ? "Oprit" : "Off";
  const pickDayLabel = locale === "ro" ? "Alege o zi" : "Pick a day";

  return (
    <div>
      <FilterSearch
        value={searchDraft}
        onChange={onSearchDraftChange}
        placeholder={
          locale === "ro"
            ? "Caută locații, petreceri…"
            : "Search venues, parties…"
        }
      />

      <FilterMenuProvider>
        <div className="mt-3 -mx-1 overflow-x-auto scrollbar-none">
          <div className="flex w-max items-center gap-2 px-1 py-0.5">
            {showWhen ? (
              <FilterDropdown
                id="filter-when"
                label={whenLabel}
                valueLabel={whenValueLabel(datePreset, customDate, locale)}
                active={Boolean(datePreset)}
              >
                {(close) => (
                  <div className="w-[18.5rem]">
                    <FilterOptions
                      value={datePreset ?? null}
                      options={[
                        { value: null, label: anyTimeLabel },
                        ...DATE_PRESETS.map((preset) => ({
                          value: preset,
                          label: datePresetLabel(preset, locale),
                        })),
                      ]}
                      onChange={(value) => {
                        onDateChange?.({
                          datePreset: value ?? undefined,
                          customDate: undefined,
                        });
                        close();
                      }}
                    />
                    <div className="mx-3 my-1 h-px bg-firefly/10" />
                    <p className="px-3.5 pb-1 pt-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground/45">
                      {pickDayLabel}
                    </p>
                    <MiniDatePicker
                      selectedDate={
                        datePreset === "custom" ? customDate : undefined
                      }
                      onSelect={(dateKey) => {
                        onDateChange?.({
                          datePreset: "custom",
                          customDate: dateKey,
                        });
                        close();
                      }}
                    />
                  </div>
                )}
              </FilterDropdown>
            ) : null}

            <FilterDropdown
              id="filter-type"
              label={typeLabel}
              valueLabel={
                eventType ? formatEventTypeLabel(eventType) : undefined
              }
              active={Boolean(eventType)}
            >
              {(close) => (
                <FilterOptions
                  value={eventType ?? null}
                  options={[
                    { value: null, label: allLabel },
                    ...EVENT_TYPES.map((type) => ({
                      value: type,
                      label: formatEventTypeLabel(type),
                    })),
                  ]}
                  onChange={(value) => {
                    onEventTypeChange(value ?? undefined);
                    close();
                  }}
                />
              )}
            </FilterDropdown>

            {showGenre ? (
              <FilterDropdown
                id="filter-genre"
                label={genreLabel}
                valueLabel={genre ? formatGenreLabel(genre) : undefined}
                active={Boolean(genre)}
              >
                {(close) => (
                  <FilterOptions
                    value={genre ?? null}
                    options={[
                      { value: null, label: allLabel },
                      ...GENRES.map((item) => ({
                        value: item,
                        label: formatGenreLabel(item),
                      })),
                    ]}
                    onChange={(value) => {
                      onGenreChange?.(value ?? undefined);
                      close();
                    }}
                  />
                )}
              </FilterDropdown>
            ) : null}

            {showDistance ? (
              <FilterDropdown
                id="filter-distance"
                label={nearLabel}
                valueLabel={distanceKm ? `${distanceKm} km` : undefined}
                active={distanceKm != null}
                align="end"
              >
                {(close) => (
                  <FilterOptions
                    value={distanceKm ?? null}
                    options={[
                      { value: null, label: offLabel },
                      ...DISTANCE_OPTIONS.map((km) => ({
                        value: km,
                        label: `${km} km`,
                      })),
                    ]}
                    onChange={(value) => {
                      onDistanceChange?.(value);
                      close();
                    }}
                  />
                )}
              </FilterDropdown>
            ) : null}

            {showPromoted ? (
              <FilterChip
                active={Boolean(promotedOnly)}
                aria-pressed={Boolean(promotedOnly)}
                onClick={() =>
                  onPromotedChange?.(promotedOnly ? undefined : true)
                }
              >
                {locale === "ro" ? "Promovate" : "Promoted"}
              </FilterChip>
            ) : null}
          </div>
        </div>
      </FilterMenuProvider>

      {distanceHint ? (
        <p className="mt-2 text-xs text-foreground/50">{distanceHint}</p>
      ) : null}

      {showMeta ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          {filteredCount != null ? (
            <p className="text-sm text-foreground/60">
              <span className="font-medium text-firefly">{filteredCount}</span>{" "}
              {locale === "ro" ? "evenimente strălucesc" : "events glowing"}
            </p>
          ) : (
            <span />
          )}
          {onReset && hasActiveFilters ? (
            <button
              type="button"
              onClick={onReset}
              className="font-mono text-xs uppercase tracking-wider-2 text-foreground/50 transition-colors hover:text-firefly"
            >
              {locale === "ro" ? "Resetează" : "Reset"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
