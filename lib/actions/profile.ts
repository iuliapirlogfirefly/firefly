"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult } from "@/types";

export type NearbyPreferences = {
  optIn: boolean;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
};

export async function getNearbyPreferences(): Promise<NearbyPreferences | null> {
  if (supabaseDisabled()) return null;

  const session = await getSession();
  if (!session.userId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "nearby_events_opt_in, nearby_lat, nearby_lng, nearby_radius_km"
    )
    .eq("id", session.userId)
    .single();

  if (!data) return null;

  return {
    optIn: data.nearby_events_opt_in,
    lat: data.nearby_lat,
    lng: data.nearby_lng,
    radiusKm: data.nearby_radius_km,
  };
}

export async function getNewsletterOptIn(): Promise<boolean | null> {
  if (supabaseDisabled()) return null;

  const session = await getSession();
  if (!session.userId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("newsletter_opt_in")
    .eq("id", session.userId)
    .single();

  if (!data) return null;
  return data.newsletter_opt_in;
}

export async function updateNearbyPreferences(
  prefs: NearbyPreferences
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.userId) return failure("Authentication required");

    if (prefs.optIn && (prefs.lat == null || prefs.lng == null)) {
      return failure("Location required for nearby event notifications");
    }

    if (![2, 5, 10].includes(prefs.radiusKm)) {
      return failure("Invalid radius");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        nearby_events_opt_in: prefs.optIn,
        nearby_lat: prefs.lat,
        nearby_lng: prefs.lng,
        nearby_radius_km: prefs.radiusKm,
      })
      .eq("id", session.userId);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to update preferences"
    );
  }
}
