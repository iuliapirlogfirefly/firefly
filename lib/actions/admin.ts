"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, requireRole } from "@/lib/auth/session";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import {
  sendBusinessApprovedEmail,
  sendBusinessRejectedEmail,
  sendEmail,
} from "@/lib/notifications/email";
import type { ActionResult } from "@/types";

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
    return failure(e instanceof Error ? e.message : "Failed to publish feed post");
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
    const { error } = await supabase
      .from("feed_posts")
      .update({ status: "rejected", rejection_reason: reason })
      .eq("id", postId);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to reject feed post");
  }
}

export async function sendNewsletter(
  subject: string,
  htmlContent: string
): Promise<ActionResult<{ sent: number }>> {
  const disabled = supabaseDisabled<{ sent: number }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    requireRole(session, ["admin"]);

    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: subscribers, error } = await supabase
      .from("profiles")
      .select("id, preferred_locale")
      .eq("newsletter_opt_in", true);

    if (error) return failure(error.message);

    let sent = 0;
    for (const subscriber of subscribers ?? []) {
      const { data: authUser } = await admin.auth.admin.getUserById(
        subscriber.id
      );
      if (authUser?.user?.email) {
        await sendEmail({
          to: authUser.user.email,
          subject,
          html: htmlContent,
          locale: (subscriber.preferred_locale as "en" | "ro") ?? "en",
        });
        sent++;
      }
    }

    return success({ sent });
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Failed to send newsletter");
  }
}
