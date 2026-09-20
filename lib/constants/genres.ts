import type { Genre } from "@/types";

export const GENRE_OTHER_MAX_LENGTH = 40;

export const GENRES = [
  "techno",
  "house",
  "afro_house",
  "minimal",
  "hip_hop_rnb",
  "commercial",
  "latin",
  "manele",
  "pop",
  "edm",
  "live_music",
  "jazz",
  "punk",
  "rock",
  "open_format",
  "other",
] as const satisfies readonly Genre[];

const GENRE_SET = new Set<string>(GENRES);

export function isGenre(value: string): value is Genre {
  return GENRE_SET.has(value);
}

export function formatGenreLabel(
  genre: Genre,
  t: (key: string) => string,
  genreOther?: string | null
): string {
  if (genre === "other") {
    const custom = genreOther?.trim();
    return custom || t("other");
  }
  return t(genre);
}

export function normalizeGenres(
  values: readonly string[] | null | undefined
): Genre[] {
  const seen = new Set<Genre>();
  for (const value of values ?? []) {
    if (isGenre(value)) seen.add(value);
  }
  return GENRES.filter((genre) => seen.has(genre));
}

export function normalizeGenreOther(
  genres: readonly string[] | null | undefined,
  value: string | null | undefined
): string | null {
  if (!normalizeGenres(genres).includes("other")) return null;
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  return trimmed.slice(0, GENRE_OTHER_MAX_LENGTH);
}

export function formatGenresLabel(
  genres: readonly string[],
  t: (key: string) => string,
  genreOther?: string | null
): string {
  return normalizeGenres(genres)
    .map((genre) => formatGenreLabel(genre, t, genreOther))
    .join(" · ");
}

export function genresOverlap(
  eventGenres: readonly string[],
  selected: Iterable<string>
): boolean {
  const selectedSet = selected instanceof Set ? selected : new Set(selected);
  return eventGenres.some((genre) => selectedSet.has(genre));
}
