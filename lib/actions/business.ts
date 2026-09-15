"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, requireAuth } from "@/lib/auth/session";
import { deactivatePromotionsForTarget } from "@/lib/stripe/promotions";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult, BusinessBillingInfo, BusinessType } from "@/types";
import type { CreateFeedPostInput, UpdateFeedPostInput } from "@/types/events";

const billingInfoSchema = z.object({
  legalName: z.string().min(2).max(200),
  cui: z.string().min(2).max(32),
  billingAddress: z.string().min(2).max(300),
  billingCity: z.string().min(2).max(100),
  billingCounty: z.string().min(2).max(100),
  billingPostalCode: z.string().min(2).max(20),
  billingCountry: z.string().min(2).max(2).default("RO"),
});

const registerBusinessSchema = z.object({
  type: z.enum(["venue", "organizer"]),
  name: z.string().min(2),
  billing: billingInfoSchema,
  venue: z
    .object({
      name: z.string(),
      address: z.string(),
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export async function createBusinessAccountForProfile(
  supabase: SupabaseClient,
  userId: string,
  type: BusinessType,
  name: string,
  billing: BusinessBillingInfo,
  venue?: { name: string; address: string; lat: number; lng: number }
): Promise<ActionResult<{ id: string }>> {
  const { data: existing } = await supabase
    .from("business_accounts")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (existing) return failure("Business account already exists");

  const role = type === "venue" ? "business_venue" : "business_organizer";

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (profileError) return failure(profileError.message);

  const { data: business, error } = await supabase
    .from("business_accounts")
    .insert({
      profile_id: userId,
      type,
      name,
      status: "pending",
      legal_name: billing.legalName,
      cui: billing.cui,
      billing_address: billing.billingAddress,
      billing_city: billing.billingCity,
      billing_county: billing.billingCounty,
      billing_postal_code: billing.billingPostalCode,
      billing_country: billing.billingCountry || "RO",
    })
    .select("id")
    .single();

  if (error) return failure(error.message);

  if (type === "venue" && venue) {
    const { error: venueError } = await supabase.from("venues").insert({
      business_account_id: business.id,
      name: venue.name,
      address: venue.address,
      lat: venue.lat,
      lng: venue.lng,
    });
    if (venueError) return failure(venueError.message);
  }

  return success({ id: business.id });
}

export async function registerBusinessAccount(
  type: BusinessType,
  name: string,
  billing: BusinessBillingInfo,
  venue?: { name: string; address: string; lat: number; lng: number }
): Promise<ActionResult<{ id: string }>> {
  const disabled = supabaseDisabled<{ id: string }>();
  if (disabled) return disabled;

  try {
    const parsed = registerBusinessSchema.safeParse({ type, name, billing, venue });
    if (!parsed.success) return failure(parsed.error.message);

    const session = await getSession();
    const userId = requireAuth(session);

    const supabase = await createClient();

    return createBusinessAccountForProfile(
      supabase,
      userId,
      type,
      name,
      billing,
      venue
    );
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to register business account"
    );
  }
}

export async function updateBusinessBilling(
  businessAccountId: string,
  billing: BusinessBillingInfo
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    const parsed = billingInfoSchema.safeParse(billing);
    if (!parsed.success) return failure(parsed.error.message);

    const isAdmin = session.role === "admin";
    const isOwner = session.businessAccountId === businessAccountId;
    if (!isAdmin && !isOwner) {
      return failure("Not authorized");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("business_accounts")
      .update({
        legal_name: parsed.data.legalName,
        cui: parsed.data.cui,
        billing_address: parsed.data.billingAddress,
        billing_city: parsed.data.billingCity,
        billing_county: parsed.data.billingCounty,
        billing_postal_code: parsed.data.billingPostalCode,
        billing_country: parsed.data.billingCountry || "RO",
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessAccountId);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to update billing info"
    );
  }
}

export async function submitFeedPost(
  data: CreateFeedPostInput
): Promise<ActionResult<{ id: string }>> {
  const disabled = supabaseDisabled<{ id: string }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const supabase = await createClient();
    const { data: post, error } = await supabase
      .from("feed_posts")
      .insert({
        business_account_id: session.businessAccountId,
        category: data.category,
        status: "pending",
        translations: data.translations,
        media_url: data.mediaUrl ?? null,
      })
      .select("id")
      .single();

    if (error) return failure(error.message);
    return success({ id: post.id });
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to submit What Did You Miss post");
  }
}

export async function updateFeedPost(
  id: string,
  data: UpdateFeedPostInput
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("feed_posts")
      .select("id, business_account_id, status")
      .eq("id", id)
      .single();

    if (!existing || existing.business_account_id !== session.businessAccountId) {
      return failure("Post not found");
    }

    const wasPublished = existing.status === "published";

    const { data: updated, error } = await supabase
      .from("feed_posts")
      .update({
        category: data.category,
        translations: data.translations,
        media_url: data.mediaUrl ?? null,
        status: "pending",
        rejection_reason: null,
        published_at: null,
      })
      .eq("id", id)
      .eq("business_account_id", session.businessAccountId)
      .select("id")
      .maybeSingle();

    if (error) return failure(error.message);
    if (!updated) return failure("Post could not be updated");

    if (wasPublished) {
      updateTag("feed");
    }

    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to update What Did You Miss post");
  }
}

export async function deleteBusinessFeedPost(id: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("feed_posts")
      .select("id, business_account_id")
      .eq("id", id)
      .single();

    if (!existing || existing.business_account_id !== session.businessAccountId) {
      return failure("Post not found");
    }

    const admin = createAdminClient();
    await deactivatePromotionsForTarget(admin, session.businessAccountId, id);

    const { error } = await supabase.from("feed_posts").delete().eq("id", id);
    if (error) return failure(error.message);

    updateTag("feed");
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to delete What Did You Miss post"
    );
  }
}

export async function getUploadUrl(
  bucket: "event-images" | "feed-media" | "newsletter-media",
  fileName: string
): Promise<ActionResult<{ signedUrl: string; token: string; path: string }>> {
  const disabled = supabaseDisabled<{
    signedUrl: string;
    token: string;
    path: string;
  }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId && session.role !== "admin") {
      return failure("Business account required");
    }

    if (bucket === "newsletter-media" && session.role !== "admin") {
      return failure("Admin access required");
    }

    const supabase = await createClient();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${session.businessAccountId ?? "admin"}/${Date.now()}-${safeName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) return failure(error.message);
    return success({ signedUrl: data.signedUrl, token: data.token, path });
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to get upload URL");
  }
}

export async function getPublicImageUrl(
  bucket: "event-images" | "feed-media" | "newsletter-media",
  path: string
): Promise<string> {
  const disabled = supabaseDisabled();
  if (disabled) return "";

  const supabase = await createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

const contactMessageSchema = z.object({
  subject: z.string().min(2).max(200),
  body: z.string().min(10).max(5000),
});

export async function submitContactMessage(
  subject: string,
  body: string
): Promise<ActionResult<{ id: string }>> {
  const disabled = supabaseDisabled<{ id: string }>();
  if (disabled) return disabled;

  try {
    const parsed = contactMessageSchema.safeParse({ subject, body });
    if (!parsed.success) return failure(parsed.error.message);

    const session = await getSession();
    const userId = requireAuth(session);
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const supabase = await createClient();
    const { data: business } = await supabase
      .from("business_accounts")
      .select("name")
      .eq("id", session.businessAccountId)
      .single();

    const { data: message, error } = await supabase
      .from("contact_messages")
      .insert({
        business_account_id: session.businessAccountId,
        profile_id: userId,
        subject: parsed.data.subject.trim(),
        body: parsed.data.body.trim(),
        status: "unread",
      })
      .select("id")
      .single();

    if (error) return failure(error.message);

    const supportEmail = process.env.SUPPORT_EMAIL;
    if (supportEmail) {
      const { sendContactMessageEmail } = await import(
        "@/lib/notifications/email"
      );
      try {
        await sendContactMessageEmail({
          to: supportEmail,
          businessName: business?.name ?? session.displayName ?? "Business",
          subject: parsed.data.subject.trim(),
          body: parsed.data.body.trim(),
          replyTo: session.email,
        });
      } catch (emailError) {
        console.warn("[contact] Failed to email support:", emailError);
      }
    }

    return success({ id: message.id });
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to send contact message"
    );
  }
}
