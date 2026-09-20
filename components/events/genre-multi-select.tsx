"use client";

import { useTranslations } from "next-intl";
import {
  formatGenreLabel,
  GENRE_OTHER_MAX_LENGTH,
  GENRES,
  normalizeGenres,
} from "@/lib/constants/genres";
import type { Genre } from "@/types";

type Props = {
  value: Genre[];
  onChange: (genres: Genre[]) => void;
  otherName: string;
  onOtherNameChange: (value: string) => void;
  disabled?: boolean;
  variant?: "admin" | "business";
};

export function GenreMultiSelect({
  value,
  onChange,
  otherName,
  onOtherNameChange,
  disabled,
  variant = "business",
}: Props) {
  const tGenres = useTranslations("genres");
  const tEvent = useTranslations("event");
  const selected = new Set(value);
  const otherSelected = selected.has("other");

  const toggle = (genre: Genre) => {
    if (selected.has(genre)) {
      onChange(value.filter((item) => item !== genre));
      if (genre === "other") onOtherNameChange("");
      return;
    }
    onChange(normalizeGenres([...value, genre]));
  };

  const onClass =
    variant === "admin"
      ? "border-foreground/40 bg-foreground/10 text-foreground"
      : "border-firefly/60 bg-firefly/10 text-firefly";
  const offClass =
    variant === "admin"
      ? "border-border bg-background text-foreground/70 hover:border-foreground/30"
      : "border-firefly/10 bg-surface-2/40 text-foreground/70 hover:border-firefly/30";
  const inputClass =
    variant === "admin"
      ? "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground/30"
      : "w-full rounded-xl border border-firefly/20 bg-surface-1/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-firefly/50";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {GENRES.map((genre) => {
          const on = selected.has(genre);

          return (
            <button
              key={genre}
              type="button"
              disabled={disabled}
              onClick={() => toggle(genre)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                on ? onClass : offClass
              }`}
            >
              {formatGenreLabel(genre, tGenres)}
            </button>
          );
        })}
      </div>
      {otherSelected ? (
        <input
          type="text"
          value={otherName}
          onChange={(e) => onOtherNameChange(e.target.value)}
          disabled={disabled}
          maxLength={GENRE_OTHER_MAX_LENGTH}
          placeholder={tEvent("genreOtherPlaceholder")}
          className={inputClass}
        />
      ) : null}
    </div>
  );
}
