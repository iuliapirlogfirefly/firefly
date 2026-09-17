"use client";

import { useTranslations } from "next-intl";
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
import { dateTimeLocale } from "@/lib/i18n/date-locale";
import type { DatePreset, EventType, Genre, Locale } from "@/types";

const DATE_PRESETS = [
  "tonight",
  "tomorrow",
  "this_weekend",
  "this_week",
] as const satisfies ReadonlyArray<Exclude<DatePreset, "custom">>;

const DATE_PRESET_MESSAGE = {
  tonight: "tonight",
  tomorrow: "tomorrow",
  this_weekend: "thisWeekend",
  this_week: "thisWeek",
  custom: "custom",
} as const;

const DISTANCE_OPTIONS = [2, 5, 10] as const;

function datePresetLabel(
  preset: DatePreset,
  t: (key: (typeof DATE_PRESET_MESSAGE)[DatePreset]) => string
): string {
  return t(DATE_PRESET_MESSAGE[preset]);
}

function formatCustomDate(dateKey: string, locale: Locale): string {
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return parsed.toLocaleDateString(dateTimeLocale(locale), {
    day: "numeric",
    month: "short",
  });
}

function whenValueLabel(
  datePreset: DatePreset | undefined,
  customDate: string | undefined,
  locale: Locale,
  t: (key: (typeof DATE_PRESET_MESSAGE)[DatePreset]) => string
): string | undefined {
  if (datePreset === "custom" && customDate) {
    return formatCustomDate(customDate, locale);
  }
  if (datePreset && datePreset !== "custom") {
    return datePresetLabel(datePreset, t);
  }
  return undefined;
}

export type DiscoveryFilterBarProps = {
  locale: Locale;
  searchDraft?: string;
  onSearchDraftChange?: (value: string) => void;
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
  const t = useTranslations("discovery");
  const tGenres = useTranslations("genres");
  const tTypes = useTranslations("eventTypes");
  const showSearch = searchDraft != null && onSearchDraftChange != null;
  const showWhen = Boolean(onDateChange);
  const showGenre = Boolean(onGenreChange);
  const showDistance = Boolean(onDistanceChange);
  const showPromoted = Boolean(onPromotedChange);
  const showMeta = filteredCount != null || Boolean(onReset);

  return (
    <div>
      {showSearch ? (
        <FilterSearch
          value={searchDraft}
          onChange={onSearchDraftChange}
          placeholder={t("searchPlaceholder")}
        />
      ) : null}

      <FilterMenuProvider>
        <div
          className={`${showSearch ? "mt-3" : ""} -mx-1 overflow-x-auto scrollbar-none`}
        >
          <div className="flex w-max items-center gap-2 px-1 py-0.5">
            {showWhen ? (
              <FilterDropdown
                id="filter-when"
                label={t("when")}
                valueLabel={whenValueLabel(datePreset, customDate, locale, t)}
                active={Boolean(datePreset)}
              >
                {(close) => (
                  <div className="w-[18.5rem]">
                    <FilterOptions
                      value={datePreset ?? null}
                      options={[
                        { value: null, label: t("anyTime") },
                        ...DATE_PRESETS.map((preset) => ({
                          value: preset,
                          label: datePresetLabel(preset, t),
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
                      {t("pickADay")}
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
              label={t("type")}
              valueLabel={
                eventType ? formatEventTypeLabel(eventType, tTypes) : undefined
              }
              active={Boolean(eventType)}
            >
              {(close) => (
                <FilterOptions
                  value={eventType ?? null}
                  options={[
                    { value: null, label: t("all") },
                    ...EVENT_TYPES.map((type) => ({
                      value: type,
                      label: formatEventTypeLabel(type, tTypes),
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
                label={t("genre")}
                valueLabel={genre ? formatGenreLabel(genre, tGenres) : undefined}
                active={Boolean(genre)}
              >
                {(close) => (
                  <FilterOptions
                    value={genre ?? null}
                    options={[
                      { value: null, label: t("all") },
                      ...GENRES.map((item) => ({
                        value: item,
                        label: formatGenreLabel(item, tGenres),
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
                label={t("near")}
                valueLabel={distanceKm ? t("km", { km: distanceKm }) : undefined}
                active={distanceKm != null}
                align="end"
              >
                {(close) => (
                  <FilterOptions
                    value={distanceKm ?? null}
                    options={[
                      { value: null, label: t("off") },
                      ...DISTANCE_OPTIONS.map((km) => ({
                        value: km,
                        label: t("km", { km }),
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
                {t("promoted")}
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
              {t("eventsGlowing", { count: filteredCount })}
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
              {t("reset")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
