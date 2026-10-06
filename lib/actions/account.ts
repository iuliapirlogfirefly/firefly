"use server";

import { updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cancelScheduledReminderEmail } from "@/lib/notifications/email";
import { explainStripeError, getStripe } from "@/lib/stripe/client";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type AdminClient = SupabaseClient<Database>;

const MEDIA_BUCKETS = ["event-images", "feed-media"] as const;
const REMINDER_ID_CHUNK = 100;

function emailsMatch(typed: string, actual: string | null | undefined): boolean {
  const expected = actual?.trim().toLowerCase() ?? "";
  if (!expected) return false;
  return typed.trim().toLowerCase() === expected;
}

function isStripeMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "resource_missing"
  );
}

async function cancelStripeBilling(params: {
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
}): Promise<string | null> {
  if (!params.stripeSubscriptionId && !params.stripeCustomerId) return null;

  const stripe = getStripe();

  if (params.stripeSubscriptionId) {
    try {
      const existing = await stripe.subscriptions.retrieve(
        params.stripeSubscriptionId
      );
      if (
        existing.status !== "canceled" &&
        existing.status !== "incomplete_expired"
      ) {
        await stripe.subscriptions.cancel(params.stripeSubscriptionId);
      }
    } catch (error) {
      if (!isStripeMissing(error)) {
        return explainStripeError(error, "Failed to cancel subscription");
      }
    }
  }

  if (params.stripeCustomerId) {
    try {
      await stripe.customers.del(params.stripeCustomerId);
    } catch (error) {
      if (!isStripeMissing(error)) {
        return explainStripeError(error, "Failed to remove billing profile");
      }
    }
  }

  return null;
}

async function cancelReminderEmails(
  admin: AdminClient,
  userId: string,
  eventIds: string[]
) {
  const emailIds = new Set<string>();

  const { data: ownReminders, error: ownError } = await admin
    .from("event_reminders")
    .select("resend_email_id")
    .eq("user_id", userId)
    .not("resend_email_id", "is", null);

  if (ownError) throw new Error(ownError.message);
  for (const row of ownReminders ?? []) {
    if (row.resend_email_id) emailIds.add(row.resend_email_id);
  }

  for (let index = 0; index < eventIds.length; index += REMINDER_ID_CHUNK) {
    const chunk = eventIds.slice(index, index + REMINDER_ID_CHUNK);
    const { data: related, error } = await admin
      .from("event_reminders")
      .select("resend_email_id")
      .in("event_id", chunk)
      .not("resend_email_id", "is", null);
    if (error) throw new Error(error.message);
    for (const row of related ?? []) {
      if (row.resend_email_id) emailIds.add(row.resend_email_id);
    }
  }

  await Promise.all(
    [...emailIds].map((emailId) => cancelScheduledReminderEmail(emailId))
  );
}

async function deleteStoragePrefix(
  admin: AdminClient,
  bucket: (typeof MEDIA_BUCKETS)[number],
  prefix: string
) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit: 100,
    });
    if (error) throw new Error(error.message);

    const paths = (data ?? [])
      .filter((item) => item.id)
      .map((item) => `${prefix}/${item.name}`);
    if (!paths.length) return;

    const { error: removeError } = await admin.storage.from(bucket).remove(paths);
    if (removeError) throw new Error(removeError.message);
  }
}

async function deleteBusinessContent(
  admin: AdminClient,
  businessAccountId: string,
  userId: string
) {
  const { data: events, error: eventsError } = await admin
    .from("events")
    .select("id")
    .eq("business_account_id", businessAccountId);
  if (eventsError) throw new Error(eventsError.message);

  const eventIds = (events ?? []).map((event) => event.id);
  await cancelReminderEmails(admin, userId, eventIds);

  for (const bucket of MEDIA_BUCKETS) {
    await deleteStoragePrefix(admin, bucket, businessAccountId);
  }

  const { error: deleteEventsError } = await admin
    .from("events")
    .delete()
    .eq("business_account_id", businessAccountId);
  if (deleteEventsError) throw new Error(deleteEventsError.message);

  const { error: deletePostsError } = await admin
    .from("feed_posts")
    .delete()
    .eq("business_account_id", businessAccountId);
  if (deletePostsError) throw new Error(deletePostsError.message);

  updateTag("events");
  updateTag("feed");
}

async function revokeAndDeleteUser(userId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token && session.user.id === userId) {
    try {
      const { error } = await admin.auth.admin.signOut(
        session.access_token,
        "global"
      );
      if (error) {
        console.warn("[account] Failed to revoke sessions", error.message);
      }
    } catch (error) {
      console.warn("[account] Failed to revoke sessions", error);
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) throw new Error(deleteError.message);

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.warn("[account] Cookie sign-out after deletion failed", error);
  }
}

export async function deleteOwnAccount(
  confirmationEmail: string
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  const t = await getTranslations("accountDeletion");

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return failure(t("notAuthenticated"));
    if (!emailsMatch(confirmationEmail, user.email)) {
      return failure(t("emailMismatch"));
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) return failure(profileError.message);
    if (profile?.role === "admin") return failure(t("adminBlocked"));

    const { data: business, error: businessError } = await admin
      .from("business_accounts")
      .select("id, stripe_customer_id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (businessError) return failure(businessError.message);

    if (business) {
      const { data: subscription, error: subscriptionError } = await admin
        .from("subscriptions")
        .select("stripe_subscription_id, stripe_customer_id")
        .eq("business_account_id", business.id)
        .maybeSingle();
      if (subscriptionError) return failure(subscriptionError.message);

      const billingError = await cancelStripeBilling({
        stripeSubscriptionId: subscription?.stripe_subscription_id ?? null,
        stripeCustomerId:
          business.stripe_customer_id ?? subscription?.stripe_customer_id ?? null,
      });
      if (billingError) return failure(billingError);

      const { error: paymentsError } = await admin
        .from("payments")
        .update({ business_account_id: null, metadata: {} })
        .eq("business_account_id", business.id);
      if (paymentsError) return failure(paymentsError.message);

      await deleteBusinessContent(admin, business.id, user.id);
    } else {
      await cancelReminderEmails(admin, user.id, []);
    }

    await revokeAndDeleteUser(user.id);
    return success(undefined);
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : t("failed")
    );
  }
}
