"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession, requireRole } from "@/lib/auth/session";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult } from "@/types";

function orderedPair(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA];
}

async function reassignChildRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "event_saves" | "event_reminders",
  primaryId: string,
  duplicateId: string
) {
  const { data: rows } = await supabase
    .from(table)
    .select("id, user_id")
    .eq("event_id", duplicateId);

  for (const row of rows ?? []) {
    const { data: existing } = await supabase
      .from(table)
      .select("id")
      .eq("user_id", row.user_id)
      .eq("event_id", primaryId)
      .maybeSingle();

    if (existing) {
      await supabase.from(table).delete().eq("id", row.id);
    } else {
      await supabase
        .from(table)
        .update({ event_id: primaryId })
        .eq("id", row.id);
    }
  }
}

export async function mergeEvents(
  primaryId: string,
  duplicateId: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  if (primaryId === duplicateId) {
    return failure("Cannot merge an event with itself");
  }

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();

    const { data: events, error: fetchError } = await supabase
      .from("events")
      .select("id")
      .in("id", [primaryId, duplicateId]);

    if (fetchError) return failure(fetchError.message);
    if ((events ?? []).length !== 2) return failure("One or both events not found");

    await reassignChildRows(supabase, "event_saves", primaryId, duplicateId);
    await reassignChildRows(supabase, "event_reminders", primaryId, duplicateId);

    await supabase
      .from("analytics_events")
      .update({ entity_id: primaryId })
      .eq("entity_type", "event")
      .eq("entity_id", duplicateId);

    const { error: archiveError } = await supabase
      .from("events")
      .update({
        status: "archived",
        is_promoted: false,
        promotion_intensity: 1,
      })
      .eq("id", duplicateId);

    if (archiveError) return failure(archiveError.message);

    updateTag("events");
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to merge events");
  }
}

export async function dismissDuplicatePair(
  eventIdA: string,
  eventIdB: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const [event_id_a, event_id_b] = orderedPair(eventIdA, eventIdB);
    const supabase = await createClient();

    const { error } = await supabase.from("event_duplicate_dismissals").insert({
      event_id_a,
      event_id_b,
      dismissed_by: session.userId,
    });

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to dismiss duplicate pair"
    );
  }
}
