import { BUCHAREST_BOUNDS } from "@/lib/utils/map-coords";

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
};

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "FireflyEvents/1.0 (https://firefly.app; location picker)";

type NominatimItem = {
  lat: string;
  lon: string;
  display_name: string;
};

function appReferer(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function nominatimFetch(path: string): Promise<Response> {
  return fetch(`${NOMINATIM_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      Referer: appReferer(),
    },
    // Nominatim asks not to cache aggressively; short cache is fine for UX.
    next: { revalidate: 0 },
  });
}

function parseItem(item: NominatimItem): GeocodeResult {
  return {
    lat: Number(item.lat),
    lng: Number(item.lon),
    displayName: item.display_name,
  };
}

/** Forward-geocode an address, biased to Bucharest / Romania. */
export async function geocodeAddress(
  query: string
): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;

  const params = new URLSearchParams({
    q,
    format: "json",
    limit: "1",
    countrycodes: "ro",
    addressdetails: "0",
    viewbox: [
      BUCHAREST_BOUNDS.minLng,
      BUCHAREST_BOUNDS.maxLat,
      BUCHAREST_BOUNDS.maxLng,
      BUCHAREST_BOUNDS.minLat,
    ].join(","),
    bounded: "0",
  });

  const res = await nominatimFetch(`/search?${params}`);
  if (!res.ok) return null;

  const data = (await res.json()) as NominatimItem[];
  if (!Array.isArray(data) || data.length === 0) return null;

  const result = parseItem(data[0]);
  if (!Number.isFinite(result.lat) || !Number.isFinite(result.lng)) return null;
  return result;
}

/** Reverse-geocode coordinates to a display address. */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    zoom: "18",
    addressdetails: "0",
  });

  const res = await nominatimFetch(`/reverse?${params}`);
  if (!res.ok) return null;

  const data = (await res.json()) as { display_name?: string; error?: string };
  if (data.error || !data.display_name) return null;
  return data.display_name;
}
