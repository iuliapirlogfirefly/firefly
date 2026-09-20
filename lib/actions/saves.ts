"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSession, requireAuth } from "@/lib/auth/session";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import { trackAnalytics } from "@/lib/actions/analytics";
import type { ActionResult } from "@/types";
import { getLocalizedField } from "@/lib/i18n/content";
import {
  cancelScheduledReminderEmail,
  scheduleEventReminderEmail,
} from "@/lib/notifications/email";
import {
  computeRemindAt,
  isEventTooFarForReminder,
} from "@/lib/utils/reminders";

export async function saveEvent(eventId: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    const userId = requireAuth(session);

    const supabase = await createClient();
    const { error } = await supabase.from("event_saves").upsert(
      { user_id: userId, event_id: eventId },
      { onConflict: "user_id,event_id" }
    );

    if (error) return failure(error.message);

    await trackAnalytics("save", "event", eventId);
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to save event");
  }
}

export async function unsaveEvent(eventId: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    const userId = requireAuth(session);

    const supabase = await createClient();
    const { error } = await supabase
      .from("event_saves")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", eventId);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to unsave event");
  }
}

const reminderSchema = z.object({
  eventId: z.string().uuid(),
});

export async function setReminder(eventId: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const parsed = reminderSchema.safeParse({ eventId });
    if (!parsed.success) return failure(parsed.error.message);

    const session = await getSession();
    const userId = requireAuth(session);
    if (!session.email) return failure("Email required for reminders");

    const supabase = await createClient();
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, starts_at, translations, status")
      .eq("id", eventId)
      .eq("status", "published")
      .single();

    if (eventError || !event) return failure("Event not found");

    if (isEventTooFarForReminder(event.starts_at)) {
      return failure(
        "Reminders can be set once the event is within 30 days."
      );
    }

    const remindAt = computeRemindAt(event.starts_at);
    if (!remindAt) return failure("Reminder is not available for this event");

    const locale = session.preferredLocale;
    const title =
      getLocalizedField(
        event.translations as Parameters<typeof getLocalizedField>[0],
        locale,
        "title"
      ) || "Firefly";

    const { data: existing } = await supabase
      .from("event_reminders")
      .select("resend_email_id")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .maybeSingle();

    const emailId = await scheduleEventReminderEmail(
      session.email,
      title,
      event.starts_at,
      remindAt,
      locale
    );

    const { error } = await supabase.from("event_reminders").upsert(
      {
        user_id: userId,
        event_id: eventId,
        remind_at: remindAt,
        resend_email_id: emailId,
        sent_at: null,
      },
      { onConflict: "user_id,event_id" }
    );

    if (error) {
      await cancelScheduledReminderEmail(emailId);
      return failure(error.message);
    }

    if (existing?.resend_email_id && existing.resend_email_id !== emailId) {
      await cancelScheduledReminderEmail(existing.resend_email_id);
    }

    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to set reminder");
  }
}

export async function removeReminder(eventId: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    const userId = requireAuth(session);

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("event_reminders")
      .select("resend_email_id")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .maybeSingle();

    if (existing?.resend_email_id) {
      await cancelScheduledReminderEmail(existing.resend_email_id);
    }

    const { error } = await supabase
      .from("event_reminders")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", eventId);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to remove reminder");
  }
}
