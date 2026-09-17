"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession, requireRole } from "@/lib/auth/session";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult } from "@/types";

export async function updatePrelaunchSettings(input: {
  active: boolean;
  endsAt: string | null;
}): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    let endsAt: string | null = null;
    if (input.endsAt) {
      const parsed = new Date(input.endsAt);
      if (Number.isNaN(parsed.getTime())) {
        return failure("Enter a valid end date and time.");
      }
      endsAt = parsed.toISOString();
    }

    if (input.active && !endsAt) {
      return failure("Set an end date before turning the countdown on.");
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .update({
        prelaunch_active: input.active,
        prelaunch_ends_at: endsAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select("id")
      .maybeSingle();

    if (error) return failure(error.message);
    if (!data) return failure("Could not update settings. Check that you are signed in as an admin.");

    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to save pre-launch settings"
    );
  }
}

export async function updateLandingStatsSettings(input: {
  enabled: boolean;
}): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .update({
        landing_stats_enabled: input.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select("id")
      .maybeSingle();

    if (error) return failure(error.message);
    if (!data) return failure("Could not update settings. Check that you are signed in as an admin.");

    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to save landing stats settings"
    );
  }
}
