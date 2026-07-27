export const BUCHAREST_BOUNDS = {
  minLat: 44.415,
  maxLat: 44.475,
  minLng: 26.045,
  maxLng: 26.125,
} as const;

export const BUCHAREST_CENTER = {
  lat: (BUCHAREST_BOUNDS.minLat + BUCHAREST_BOUNDS.maxLat) / 2,
  lng: (BUCHAREST_BOUNDS.minLng + BUCHAREST_BOUNDS.maxLng) / 2,
} as const;

/** Free dark basemap — no API token required. */
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

export const BUCHAREST_BOUNDS_LNG_LAT: [[number, number], [number, number]] = [
  [BUCHAREST_BOUNDS.minLng, BUCHAREST_BOUNDS.minLat],
  [BUCHAREST_BOUNDS.maxLng, BUCHAREST_BOUNDS.maxLat],
];
