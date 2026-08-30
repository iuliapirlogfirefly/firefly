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

const GENRE_LABELS: Record<Genre, string> = {
  techno: "Techno",
  house: "House",
  afro_house: "Afro House",
  minimal: "Minimal",
  hip_hop_rnb: "Hip Hop / R&B",
  commercial: "Commercial",
  latin: "Latin",
  manele: "Manele",
  pop: "Pop",
  edm: "EDM",
  live_music: "Live Music",
  jazz: "Jazz",
  open_format: "Open Format",
};

export function formatGenreLabel(genre: Genre): string {
  return GENRE_LABELS[genre];
}
