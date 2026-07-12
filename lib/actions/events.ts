"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, requireRole } from "@/lib/auth/session";
import { getLocalizedField } from "@/lib/i18n/content";
import {
  sendEventApprovedEmail,
  sendEventRejectedEmail,
} from "@/lib/notifications/email";
import { generateEventSlug } from "@/lib/utils/slug";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult } from "@/types";
import type { CreateEventInput, UpdateEventInput } from "@/types/events";

const createEventSchema = z.object({
  translations: z.object({
    en: z.object({ title: z.string().min(1), description: z.string() }),
    ro: z
      .object({ title: z.string().optional(), description: z.string().optional() })
      .optional(),
  }),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  genre: z.string(),
  eventType: z.string(),
  price: z.number().optional(),
  ticketUrl: z.string().url().optional().or(z.literal("")),
  coverImageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  venueId: z.string().uuid().optional(),
  venueName: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

async function getBusinessContext() {
  const session = await getSession();
  if (!session.businessAccountId) {
    throw new Error("Business account required");
  }

  const supabase = await createClient();
  const { data: business } = await supabase
    .from("business_accounts")
    .select("id, type, status")
    .eq("id", session.businessAccountId)
    .single();

  if (!business || business.status !== "approved") {
    throw new Error("Approved business account required");
  }

  return { session, business, supabase };
}

export async function createEvent(
  data: CreateEventInput
): Promise<ActionResult<{ id: string }>> {
  const disabled = supabaseDisabled<{ id: string }>();
  if (disabled) return disabled;

  try {
    const parsed = createEventSchema.safeParse(data);
    if (!parsed.success) return failure(parsed.error.message);

    const { session, business, supabase } = await getBusinessContext();

    let lat = data.lat;
    let lng = data.lng;
    let address = data.address;
    let venueName = data.venueName;
    let venueId = data.venueId;

    if (business.type === "venue") {
      const { data: venue } = await supabase
        .from("venues")
        .select("*")
        .eq("business_account_id", business.id)
        .single();

      if (!venue) return failure("Venue profile required for venue accounts");

      lat = venue.lat;
      lng = venue.lng;
      address = venue.address;
      venueName = venue.name;
      venueId = venue.id;
    } else {
      if (!lat || !lng || !address || !venueName) {
        return failure("Location details required for organizer events");
      }
    }

    const slug = generateEventSlug(data.translations.en.title);

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        business_account_id: business.id,
        venue_id: venueId ?? null,
        slug,
        status: "draft",
        source: "business",
        starts_at: data.startsAt,
        ends_at: data.endsAt ?? null,
        genre: data.genre,
        event_type: data.eventType,
        price: data.price ?? null,
        ticket_url: data.ticketUrl || null,
        cover_image_url: data.coverImageUrl ?? null,
        images: data.images ?? [],
        translations: data.translations,
        lat: lat!,
        lng: lng!,
        address: address ?? null,
        venue_name: venueName ?? null,
      })
      .select("id")
      .single();

    if (error) return failure(error.message);
    return success({ id: event.id });
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to create event");
  }
}

export async function updateEvent(
  id: string,
  data: UpdateEventInput
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const { business, supabase } = await getBusinessContext();

    const { data: existing } = await supabase
      .from("events")
      .select("status, business_account_id")
      .eq("id", id)
      .single();

    if (!existing || existing.business_account_id !== business.id) {
      return failure("Event not found");
    }

    if (!["draft", "rejected"].includes(existing.status)) {
      return failure("Only draft or rejected events can be edited");
    }

    const { error } = await supabase
      .from("events")
      .update({
        ...(data.translations && { translations: data.translations }),
        ...(data.startsAt && { starts_at: data.startsAt }),
        ...(data.endsAt !== undefined && { ends_at: data.endsAt }),
        ...(data.genre && { genre: data.genre }),
        ...(data.eventType && { event_type: data.eventType }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.ticketUrl !== undefined && {
          ticket_url: data.ticketUrl || null,
        }),
        ...(data.coverImageUrl !== undefined && {
          cover_image_url: data.coverImageUrl,
        }),
        ...(data.images && { images: data.images }),
        ...(business.type === "organizer" && data.lat && { lat: data.lat }),
        ...(business.type === "organizer" && data.lng && { lng: data.lng }),
        ...(business.type === "organizer" &&
          data.address && { address: data.address }),
        ...(business.type === "organizer" &&
          data.venueName && { venue_name: data.venueName }),
      })
      .eq("id", id);
    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to update event");
  }
}

export async function submitEventForApproval(id: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const { business, supabase } = await getBusinessContext();

    const { error } = await supabase
      .from("events")
      .update({ status: "pending", rejection_reason: null })
      .eq("id", id)
      .eq("business_account_id", business.id)
      .in("status", ["draft", "rejected"]);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to submit event");
  }
}

export async function approveEvent(id: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { data: event, error } = await supabase
      .from("events")
      .update({ status: "published", rejection_reason: null })
      .eq("id", id)
      .eq("status", "pending")
      .select("translations, business_account_id")
      .single();

    if (error) return failure(error.message);

    if (event?.business_account_id) {
      const { data: business } = await supabase
        .from("business_accounts")
        .select("profile_id")
        .eq("id", event.business_account_id)
        .single();

      if (business?.profile_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_locale")
          .eq("id", business.profile_id)
          .single();

        const admin = createAdminClient();
        const { data: authUser } = await admin.auth.admin.getUserById(
          business.profile_id
        );

        if (authUser?.user?.email) {
          const locale = (profile?.preferred_locale as "en" | "ro") ?? "en";
          const title = getLocalizedField(
            event.translations as Parameters<typeof getLocalizedField>[0],
            locale,
            "title"
          );
          await sendEventApprovedEmail(authUser.user.email, title, locale);
        }
      }
    }

    updateTag("events");
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to approve event");
  }
}

export async function rejectEvent(
  id: string,
  reason: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { data: event, error } = await supabase
      .from("events")
      .update({ status: "rejected", rejection_reason: reason })
      .eq("id", id)
      .eq("status", "pending")
      .select("translations, business_account_id")
      .single();

    if (error) return failure(error.message);

    if (event?.business_account_id) {
      const { data: business } = await supabase
        .from("business_accounts")
        .select("profile_id")
        .eq("id", event.business_account_id)
        .single();

      if (business?.profile_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_locale")
          .eq("id", business.profile_id)
          .single();

        const admin = createAdminClient();
        const { data: authUser } = await admin.auth.admin.getUserById(
          business.profile_id
        );

        if (authUser?.user?.email) {
          const locale = (profile?.preferred_locale as "en" | "ro") ?? "en";
          const title = getLocalizedField(
            event.translations as Parameters<typeof getLocalizedField>[0],
            locale,
            "title"
          );
          await sendEventRejectedEmail(
            authUser.user.email,
            title,
            reason,
            locale
          );
        }
      }
    }

    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to reject event");
  }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return failure(error.message);
    updateTag("events");
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to delete event");
  }
}

export async function archiveEvent(id: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("events")
      .update({
        status: "archived",
        is_promoted: false,
        promotion_intensity: 1,
      })
      .eq("id", id)
      .eq("status", "published");

    if (error) return failure(error.message);
    updateTag("events");
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to archive event");
  }
}

export async function restoreEvent(id: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("events")
      .update({ status: "published", rejection_reason: null })
      .eq("id", id)
      .eq("status", "archived");

    if (error) return failure(error.message);
    updateTag("events");
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to restore event");
  }
}

export async function createAdminEvent(
  data: CreateEventInput
): Promise<ActionResult<{ id: string }>> {
  const disabled = supabaseDisabled<{ id: string }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const parsed = createEventSchema.safeParse(data);
    if (!parsed.success) return failure(parsed.error.message);

    if (!data.lat || !data.lng) {
      return failure("Location required for admin events");
    }

    const supabase = await createClient();
    const slug = generateEventSlug(data.translations.en.title);

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        slug,
        status: "published",
        source: "admin",
        starts_at: data.startsAt,
        ends_at: data.endsAt ?? null,
        genre: data.genre,
        event_type: data.eventType,
        price: data.price ?? null,
        ticket_url: data.ticketUrl || null,
        cover_image_url: data.coverImageUrl ?? null,
        images: data.images ?? [],
        translations: data.translations,
        lat: data.lat,
        lng: data.lng,
        address: data.address ?? null,
        venue_name: data.venueName ?? null,
      })
      .select("id")
      .single();

    if (error) return failure(error.message);
    updateTag("events");
    return success({ id: event.id });
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to create event");
  }
}

export async function updateAdminEvent(
  id: string,
  data: UpdateEventInput
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { data: existing, error: fetchError } = await supabase
      .from("events")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) return failure("Event not found");

    const { error } = await supabase
      .from("events")
      .update({
        ...(data.translations && { translations: data.translations }),
        ...(data.startsAt && { starts_at: data.startsAt }),
        ...(data.endsAt !== undefined && { ends_at: data.endsAt }),
        ...(data.genre && { genre: data.genre }),
        ...(data.eventType && { event_type: data.eventType }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.ticketUrl !== undefined && {
          ticket_url: data.ticketUrl || null,
        }),
        ...(data.coverImageUrl !== undefined && {
          cover_image_url: data.coverImageUrl,
        }),
        ...(data.images && { images: data.images }),
        ...(data.lat !== undefined && { lat: data.lat }),
        ...(data.lng !== undefined && { lng: data.lng }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.venueName !== undefined && { venue_name: data.venueName }),
      })
      .eq("id", id);

    if (error) return failure(error.message);
    updateTag("events");
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to update event");
  }
}
