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
import { deactivatePromotionsForTarget } from "@/lib/stripe/promotions";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult } from "@/types";
import type { CreateEventInput, UpdateEventInput } from "@/types/events";
import {
  GENRE_OTHER_MAX_LENGTH,
  GENRES,
  normalizeGenreOther,
  normalizeGenres,
} from "@/lib/constants/genres";
import {
  MAX_PRICE_OPTIONS,
  PRICE_OPTION_NAME_MAX_LENGTH,
  normalizePriceOptions,
} from "@/lib/utils/event-prices";

const createEventSchema = z
  .object({
    translations: z.object({
      en: z.object({ title: z.string().min(1), description: z.string() }),
      ro: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
        })
        .optional(),
    }),
    startsAt: z.string(),
    endsAt: z.string().optional(),
    genres: z.array(z.enum(GENRES)).min(1),
    genreOther: z.string().max(GENRE_OTHER_MAX_LENGTH).optional(),
    eventType: z.string(),
    price: z.number().finite().min(0).nullable().optional(),
    priceOptions: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(PRICE_OPTION_NAME_MAX_LENGTH),
          price: z.number().finite().min(0),
        })
      )
      .max(MAX_PRICE_OPTIONS)
      .optional(),
    ticketUrl: z.string().url().optional().or(z.literal("")),
    websiteUrl: z.string().url().optional().or(z.literal("")),
    specialGuest: z.string().optional(),
    organizerName: z.string().optional(),
    coverImageUrl: z.string().optional(),
    images: z.array(z.string()).optional(),
    venueId: z.string().uuid().optional(),
    venueName: z.string().optional(),
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    submitForApproval: z.boolean().optional(),
  })
.superRefine((data, ctx) => {
  if (
    data.genres.includes("other") &&
    !normalizeGenreOther(data.genres, data.genreOther)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["genreOther"],
      message: "Name the other music type.",
    });
  }
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
        .maybeSingle();

      if (venue) {
        venueId = venue.id;
        // Prefer form pin/address; fall back to venue profile defaults.
        lat = lat ?? venue.lat;
        lng = lng ?? venue.lng;
        address = address || venue.address;
        venueName = venueName || venue.name;
      } else if (venueName && address && lat != null && lng != null) {
        const { data: createdVenue, error: venueError } = await supabase
          .from("venues")
          .insert({
            business_account_id: business.id,
            name: venueName,
            address,
            lat,
            lng,
          })
          .select("id")
          .single();

        if (venueError || !createdVenue) {
          return failure(
            venueError?.message ?? "Failed to create venue profile"
          );
        }
        venueId = createdVenue.id;
      }
    }

    if (!lat || !lng || !address || !venueName) {
      return failure("Location details required");
    }

    const slug = generateEventSlug(data.translations.en.title);

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        business_account_id: business.id,
        venue_id: venueId ?? null,
        slug,
        status: data.submitForApproval ? "pending" : "draft",
        source: "business",
        starts_at: data.startsAt,
        ends_at: data.endsAt ?? null,
        genres: normalizeGenres(data.genres),
        genre_other: normalizeGenreOther(data.genres, data.genreOther),
        event_type: data.eventType,
        price: data.price ?? null,
        price_options: normalizePriceOptions(data.priceOptions),
        ticket_url: data.ticketUrl || null,
        website_url: data.websiteUrl || null,
        special_guest: data.specialGuest?.trim() || null,
        organizer_name: data.organizerName?.trim() || null,
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

    if (existing.status === "archived") {
      return failure("Archived events cannot be edited");
    }

    if (!["draft", "rejected", "pending", "published"].includes(existing.status)) {
      return failure("This event cannot be edited");
    }

    if (data.genres) {
      const genres = normalizeGenres(data.genres);
      if (genres.includes("other") && !normalizeGenreOther(genres, data.genreOther)) {
        return failure("Name the other music type.");
      }
    }

    const wasPublished = existing.status === "published";
    const nextStatus =
      existing.status === "pending" || existing.status === "published"
        ? "pending"
        : data.submitForApproval
          ? "pending"
          : existing.status;

    const { error } = await supabase
      .from("events")
      .update({
        ...(data.translations && { translations: data.translations }),
        ...(data.startsAt && { starts_at: data.startsAt }),
        ...(data.endsAt !== undefined && { ends_at: data.endsAt }),
        ...(data.genres && {
          genres: normalizeGenres(data.genres),
          genre_other: normalizeGenreOther(data.genres, data.genreOther),
        }),
        ...(data.eventType && { event_type: data.eventType }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.priceOptions !== undefined && {
          price_options: normalizePriceOptions(data.priceOptions),
        }),
        ...(data.ticketUrl !== undefined && {
          ticket_url: data.ticketUrl || null,
        }),
        ...(data.websiteUrl !== undefined && {
          website_url: data.websiteUrl || null,
        }),
        ...(data.specialGuest !== undefined && {
          special_guest: data.specialGuest?.trim() || null,
        }),
        ...(data.organizerName !== undefined && {
          organizer_name: data.organizerName?.trim() || null,
        }),
        ...(data.coverImageUrl !== undefined && {
          cover_image_url: data.coverImageUrl,
        }),
        ...(data.images && { images: data.images }),
        ...(data.lat !== undefined && { lat: data.lat }),
        ...(data.lng !== undefined && { lng: data.lng }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.venueName !== undefined && { venue_name: data.venueName }),
        status: nextStatus,
        ...(nextStatus === "pending" ? { rejection_reason: null } : {}),
      })
      .eq("id", id);
    if (error) return failure(error.message);

    if (wasPublished) {
      updateTag("events");
    }

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
      .update({
        status: "published",
        rejection_reason: null,
        published_at: new Date().toISOString(),
      })
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

export async function deleteBusinessEvent(id: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const { business, supabase } = await getBusinessContext();

    const { data: existing } = await supabase
      .from("events")
      .select("id, business_account_id")
      .eq("id", id)
      .single();

    if (!existing || existing.business_account_id !== business.id) {
      return failure("Event not found");
    }

    const admin = createAdminClient();
    await deactivatePromotionsForTarget(admin, business.id, id);

    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return failure(error.message);

    updateTag("events");
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to delete event");
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
      .update({
        status: "published",
        rejection_reason: null,
        published_at: new Date().toISOString(),
      })
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
        genres: normalizeGenres(data.genres),
        genre_other: normalizeGenreOther(data.genres, data.genreOther),
        event_type: data.eventType,
        price: data.price ?? null,
        price_options: normalizePriceOptions(data.priceOptions),
        ticket_url: data.ticketUrl || null,
        website_url: data.websiteUrl || null,
        special_guest: data.specialGuest?.trim() || null,
        organizer_name: data.organizerName?.trim() || null,
        cover_image_url: data.coverImageUrl ?? null,
        images: data.images ?? [],
        translations: data.translations,
        lat: data.lat,
        lng: data.lng,
        address: data.address ?? null,
        venue_name: data.venueName ?? null,
        published_at: new Date().toISOString(),
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

    if (data.genres) {
      const genres = normalizeGenres(data.genres);
      if (genres.includes("other") && !normalizeGenreOther(genres, data.genreOther)) {
        return failure("Name the other music type.");
      }
    }

    const { error } = await supabase
      .from("events")
      .update({
        ...(data.translations && { translations: data.translations }),
        ...(data.startsAt && { starts_at: data.startsAt }),
        ...(data.endsAt !== undefined && { ends_at: data.endsAt }),
        ...(data.genres && {
          genres: normalizeGenres(data.genres),
          genre_other: normalizeGenreOther(data.genres, data.genreOther),
        }),
        ...(data.eventType && { event_type: data.eventType }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.priceOptions !== undefined && {
          price_options: normalizePriceOptions(data.priceOptions),
        }),
        ...(data.ticketUrl !== undefined && {
          ticket_url: data.ticketUrl || null,
        }),
        ...(data.websiteUrl !== undefined && {
          website_url: data.websiteUrl || null,
        }),
        ...(data.specialGuest !== undefined && {
          special_guest: data.specialGuest?.trim() || null,
        }),
        ...(data.organizerName !== undefined && {
          organizer_name: data.organizerName?.trim() || null,
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
