import type { Genre } from "@/types";

export const GENRES: Genre[] = [
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
  "open_format",
];

export function formatGenreLabel(
  genre: Genre,
  t: (key: string) => string
): string {
  return t(genre);
}
