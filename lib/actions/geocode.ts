"use server";

import {
  geocodeAddress,
  reverseGeocode,
  type GeocodeResult,
} from "@/lib/maps/geocode";

export async function searchAddressAction(
  query: string
): Promise<GeocodeResult | null> {
  try {
    return await geocodeAddress(query);
  } catch {
    return null;
  }
}

export async function reverseGeocodeAction(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    return await reverseGeocode(lat, lng);
  } catch {
    return null;
  }
}
