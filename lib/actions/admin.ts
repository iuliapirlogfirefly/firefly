"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, requireRole } from "@/lib/auth/session";
import { restoreFeedPostCredit } from "@/lib/stripe/feed-post-credits";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import {
  sendBusinessApprovedEmail,
  sendBusinessRejectedEmail,
  sendEmail,
} from "@/lib/notifications/email";
import {
  buildNewsletterUnsubscribeUrl,
  wrapNewsletterHtml,
} from "@/lib/newsletter/unsubscribe-token";
import type { ActionResult } from "@/types";
import type { CreateFeedPostInput } from "@/types/events";
import type { Json } from "@/types/database.types";

const createAdminFeedPostSchema = z.object({
  category: z.enum([
    "party_updates",
    "nightlife_news",
    "nightlife_chaos",
    "club_moments",
  ]),
  translations: z.object({
    en: z.object({
      title: z.string().min(1),
      description: z.string().min(1),
    }),
    ro: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
      })
      .optional(),
  }),
  mediaUrl: z.string().optional(),
});

export async function approveBusinessAccount(
  businessAccountId: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { data: business, error } = await supabase
      .from("business_accounts")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq("id", businessAccountId)
      .select("profile_id, name")
      .single();

    if (error) return failure(error.message);

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
      await sendBusinessApprovedEmail(
        authUser.user.email,
        business.name,
        (profile?.preferred_locale as "en" | "ro") ?? "en"
      );
    }

    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to approve business account"
    );
  }
}

export async function rejectBusinessAccount(
  businessAccountId: string,
  reason: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { data: business, error } = await supabase
      .from("business_accounts")
      .update({ status: "rejected", rejection_reason: reason })
      .eq("id", businessAccountId)
      .select("profile_id, name")
      .single();

    if (error) return failure(error.message);

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
      await sendBusinessRejectedEmail(
        authUser.user.email,
        business.name,
        reason,
        (profile?.preferred_locale as "en" | "ro") ?? "en"
      );
    }

    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to reject business account"
    );
  }
}

export async function suspendUser(userId: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) return failure("User not found");
    if (profile.role === "admin") return failure("Cannot suspend admin accounts");

    const isBusiness =
      profile.role === "business_venue" ||
      profile.role === "business_organizer";

    if (isBusiness) {
      const { error } = await supabase
        .from("business_accounts")
        .update({ status: "suspended" })
        .eq("profile_id", userId);
      if (error) return failure(error.message);
    } else {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (error) return failure(error.message);
    }

    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to suspend user");
  }
}

export async function unsuspendUser(userId: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) return failure("User not found");

    const isBusiness =
      profile.role === "business_venue" ||
      profile.role === "business_organizer";

    if (isBusiness) {
      return failure("Use reactivate for suspended business accounts");
    }

    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: false, suspended_at: null })
      .eq("id", userId);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to unsuspend user");
  }
}

export async function reactivateBusinessAccount(
  businessAccountId: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("business_accounts")
      .update({
        status: "approved",
        rejection_reason: null,
        approved_at: new Date().toISOString(),
      })
      .eq("id", businessAccountId)
      .eq("status", "suspended");

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to reactivate business account"
    );
  }
}

export async function publishFeedPost(postId: string): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("feed_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .in("status", ["pending", "approved"]);

    if (error) return failure(error.message);
    updateTag("feed");
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to publish What Did You Miss post");
  }
}

export async function rejectFeedPost(
  postId: string,
  reason: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { data: existing, error: existingError } = await supabase
      .from("feed_posts")
      .select("id, business_account_id, status, published_at")
      .eq("id", postId)
      .maybeSingle();

    if (existingError) return failure(existingError.message);
    if (!existing) return failure("Post not found");
    if (existing.status === "rejected") return success(undefined);

    const { error } = await supabase
      .from("feed_posts")
      .update({ status: "rejected", rejection_reason: reason })
      .eq("id", postId)
      .eq("status", existing.status);

    if (error) return failure(error.message);

    if (
      existing.business_account_id &&
      !existing.published_at &&
      (existing.status === "pending" || existing.status === "approved")
    ) {
      const admin = createAdminClient();
      await restoreFeedPostCredit(admin, existing.business_account_id);
    }

    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to reject What Did You Miss post");
  }
}

export async function createAdminFeedPost(
  data: CreateFeedPostInput
): Promise<ActionResult<{ id: string }>> {
  const disabled = supabaseDisabled<{ id: string }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const parsed = createAdminFeedPostSchema.safeParse(data);
    if (!parsed.success) return failure(parsed.error.message);

    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { data: post, error } = await admin
      .from("feed_posts")
      .insert({
        business_account_id: null,
        category: parsed.data.category,
        status: "published",
        translations: parsed.data.translations as Json,
        media_url: parsed.data.mediaUrl ?? null,
        published_at: now,
      })
      .select("id")
      .single();

    if (error) return failure(error.message);
    updateTag("feed");
    return success({ id: post.id });
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to create What Did You Miss post"
    );
  }
}

export async function sendNewsletter(
  subject: string,
  htmlContent: string,
  pdfUrls: string[] = []
): Promise<ActionResult<{ sent: number }>> {
  const disabled = supabaseDisabled<{ sent: number }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    if (pdfUrls.length > 3) {
      return failure("Maximum 3 PDF attachments allowed");
    }

    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: subscribers, error } = await supabase
      .from("profiles")
      .select("id, preferred_locale")
      .eq("newsletter_opt_in", true);

    if (error) return failure(error.message);

    const attachments = pdfUrls.map((url, index) => {
      const filename =
        url.split("/").pop()?.split("?")[0] || `newsletter-${index + 1}.pdf`;
      return {
        filename: filename.endsWith(".pdf") ? filename : `${filename}.pdf`,
        path: url,
        contentType: "application/pdf",
      };
    });

    let sent = 0;
    for (const subscriber of subscribers ?? []) {
      const { data: authUser } = await admin.auth.admin.getUserById(
        subscriber.id
      );
      const email = authUser?.user?.email;
      if (!email) continue;

      const locale =
        (subscriber.preferred_locale as "en" | "ro") ?? "en";
      const unsubscribeUrl = buildNewsletterUnsubscribeUrl(
        subscriber.id,
        locale
      );

      await sendEmail({
        to: email,
        subject,
        html: wrapNewsletterHtml(htmlContent, unsubscribeUrl, locale),
        locale,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        attachments,
      });
      sent++;
    }

    return success({ sent });
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to send newsletter");
  }
}

export async function markContactMessageRead(
  messageId: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("contact_messages")
      .update({
        status: "read",
        read_at: new Date().toISOString(),
        read_by: session.userId,
      })
      .eq("id", messageId)
      .eq("status", "unread");

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to mark message as read"
    );
  }
}

export async function archiveContactMessage(
  messageId: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("contact_messages")
      .update({
        status: "archived",
        read_at: new Date().toISOString(),
        read_by: session.userId,
      })
      .eq("id", messageId);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to archive message"
    );
  }
}

export type PromotionDeliveryInput = {
  url?: string;
  notes?: string;
};

function normalizeDeliveryFields(input: PromotionDeliveryInput) {
  const url = input.url?.trim() || null;
  const notes = input.notes?.trim() || null;
  return { url, notes };
}

export async function markPromotionDelivered(
  promotionId: string,
  input: PromotionDeliveryInput = {}
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const { url, notes } = normalizeDeliveryFields(input);
    const supabase = await createClient();
    const { error } = await supabase
      .from("promotions")
      .update({
        fulfilled_at: new Date().toISOString(),
        fulfilled_by: session.userId,
        delivery_url: url,
        delivery_notes: notes,
      })
      .eq("id", promotionId)
      .in("type", ["social_media", "newsletter"])
      .is("fulfilled_at", null);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to mark promotion as delivered"
    );
  }
}

export async function updatePromotionDelivery(
  promotionId: string,
  input: PromotionDeliveryInput
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const { url, notes } = normalizeDeliveryFields(input);
    const supabase = await createClient();
    const { error } = await supabase
      .from("promotions")
      .update({
        delivery_url: url,
        delivery_notes: notes,
      })
      .eq("id", promotionId)
      .in("type", ["social_media", "newsletter"])
      .not("fulfilled_at", "is", null);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to update delivery details"
    );
  }
}

export async function unmarkPromotionDelivered(
  promotionId: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("promotions")
      .update({
        fulfilled_at: null,
        fulfilled_by: null,
        delivery_url: null,
        delivery_notes: null,
      })
      .eq("id", promotionId)
      .in("type", ["social_media", "newsletter"]);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to unmark promotion delivery"
    );
  }
}

function invoicedFields(invoiced: boolean, userId: string | null) {
  if (invoiced) {
    return {
      invoiced_at: new Date().toISOString(),
      invoiced_by: userId,
    };
  }
  return {
    invoiced_at: null,
    invoiced_by: null,
  };
}

export async function setPromotionInvoiced(
  promotionId: string,
  invoiced: boolean
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("promotions")
      .update(invoicedFields(invoiced, session.userId))
      .eq("id", promotionId);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to update invoiced status"
    );
  }
}

export async function setSubscriptionInvoiced(
  subscriptionId: string,
  invoiced: boolean
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("subscriptions")
      .update(invoicedFields(invoiced, session.userId))
      .eq("id", subscriptionId);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to update invoiced status"
    );
  }
}
