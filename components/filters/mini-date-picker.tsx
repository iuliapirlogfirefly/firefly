"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { dateTimeLocale } from "@/lib/i18n/date-locale";
import { isToday, monthMatrix, toDateKey } from "@/lib/utils/calendar";

const WEEKDAY_KEYS = [
  "weekdayMon",
  "weekdayTue",
  "weekdayWed",
  "weekdayThu",
  "weekdayFri",
  "weekdaySat",
  "weekdaySun",
] as const;

type MiniDatePickerProps = {
  selectedDate?: string;
  onSelect: (dateKey: string) => void;
};

function parseDateKey(dateKey: string | undefined, fallback: Date) {
  if (!dateKey) return fallback;
  const parsed = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function MiniDatePicker({
  selectedDate,
  onSelect,
}: MiniDatePickerProps) {
  const t = useTranslations("discovery");
  const locale = useLocale();
  const today = useMemo(() => new Date(), []);
  const initial = parseDateKey(selectedDate, today);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const cells = useMemo(
    () => monthMatrix(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString(
    dateTimeLocale(locale),
    {
      month: "long",
      year: "numeric",
    }
  );

  const shift = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  return (
    <div className="px-2 pb-2 pt-1">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="font-heading text-sm text-foreground/85">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-firefly/20 text-foreground/70 transition-colors hover:border-firefly/50 hover:text-firefly"
            aria-label={t("prevMonth")}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-firefly/20 text-foreground/70 transition-colors hover:border-firefly/50 hover:text-firefly"
            aria-label={t("nextMonth")}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {WEEKDAY_KEYS.map((weekday) => (
          <div
            key={weekday}
            className="py-1 text-center font-mono text-[9px] uppercase tracking-wider-2 text-foreground/40"
          >
            {t(weekday)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((date, index) => {
          if (!date) return <div key={index} />;

          const key = toDateKey(date);
          const selected = key === selectedDate;
          const todayCell = isToday(key, today);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`flex h-8 w-full items-center justify-center rounded-lg text-xs transition-colors ${
                selected
                  ? "bg-firefly/15 text-firefly"
                  : todayCell
                    ? "text-firefly ring-1 ring-firefly/40 ring-inset"
                    : "text-foreground/80 hover:bg-firefly/10 hover:text-firefly"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
