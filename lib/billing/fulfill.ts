import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { activatePromotion } from "@/lib/stripe/activate-promotion";
import { addOneMonth } from "@/lib/stripe/entitlement";
import { grantFeedPostPack } from "@/lib/stripe/feed-post-credits";
import { PREMIUM_PRODUCT, SUBSCRIPTION_QUOTAS } from "@/lib/stripe/products";
import type { Database, Json } from "@/types/database.types";
import type { PromotionType } from "@/types";

type AdminClient = SupabaseClient<Database>;

const PAID_STATUSES = new Set([3, 5]);
const FAIL_STATUSES = new Set([4, 11, 13, 17, 23]);
const DECLINED_STATUS = 12;

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

function metadataOf(value: Json): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") result[key] = entry;
    else if (typeof entry === "number" || typeof entry === "boolean") {
      result[key] = String(entry);
    }
  }
  return result;
}

function amountsMatch(amountCents: number, reportedAmount: number | null | undefined): boolean {
  if (reportedAmount == null) return true;
  return Math.round(reportedAmount * 100) === amountCents;
}

async function loadPayment(
  admin: AdminClient,
  orderId: string
): Promise<PaymentRow | null> {
  const { data } = await admin
    .from("payments")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  return data;
}

async function markFailed(
  admin: AdminClient,
  payment: PaymentRow,
  status: number,
  ntpId: string | null
) {
  if (payment.status !== "pending") return;
  const metadata = {
    ...metadataOf(payment.metadata),
    netopia_status: String(status),
  };
  await admin
    .from("payments")
    .update({
      status: "failed",
      provider_payment_id: ntpId ?? payment.provider_payment_id,
      metadata,
    })
    .eq("id", payment.id)
    .eq("status", "pending");
}

async function recordDecline(
  admin: AdminClient,
  payment: PaymentRow,
  ntpId: string | null
) {
  if (payment.status !== "pending") return;
  const metadata = metadataOf(payment.metadata);
  const declines = Number(metadata.decline_count ?? "0");
  await admin
    .from("payments")
    .update({
      provider_payment_id: ntpId ?? payment.provider_payment_id,
      metadata: {
        ...metadata,
        netopia_status: String(DECLINED_STATUS),
        decline_count: String(Number.isFinite(declines) ? declines + 1 : 1),
      },
    })
    .eq("id", payment.id)
    .eq("status", "pending");
}

async function grantSideEffects(admin: AdminClient, payment: PaymentRow) {
  const metadata = metadataOf(payment.metadata);
  if (!payment.business_account_id) return;
  if (metadata.fulfilled === "true") return;

  if (metadata.fulfilling !== "true") {
    const { data: claimed } = await admin
      .from("payments")
      .update({ metadata: { ...metadata, fulfilling: "true" } })
      .eq("id", payment.id)
      .eq("status", "paid")
      .or("metadata->>fulfilling.is.null,metadata->>fulfilling.neq.true")
      .select("id")
      .maybeSingle();
    if (!claimed) return;
    metadata.fulfilling = "true";
  }

  const businessAccountId = payment.business_account_id;
  const now = new Date();

  if (metadata.product === PREMIUM_PRODUCT) {
    const periodStart = metadata.premium_period_start
      ? new Date(metadata.premium_period_start)
      : now;
    if (!metadata.premium_period_start) {
      metadata.premium_period_start = periodStart.toISOString();
      await admin
        .from("payments")
        .update({ metadata })
        .eq("id", payment.id);
    }
    await admin.from("subscriptions").upsert(
      {
        business_account_id: businessAccountId,
        stripe_subscription_id: null,
        status: "active",
        billing_type: "one_time",
        current_period_start: periodStart.toISOString(),
        current_period_end: addOneMonth(periodStart).toISOString(),
        cancel_at_period_end: true,
        terms_accepted_at: metadata.terms_accepted_at || periodStart.toISOString(),
        ...SUBSCRIPTION_QUOTAS,
        used_promoted_events: 0,
        used_feed_posts: 0,
        used_newsletters: 0,
        used_social_posts: 0,
      },
      { onConflict: "business_account_id" }
    );
  } else if (metadata.promotion_type === "feed_post") {
    if (metadata.feed_post_pack_granted !== "true") {
      await grantFeedPostPack(admin, businessAccountId);
    }
  } else if (metadata.promotion_type && metadata.target_id) {
    await activatePromotion(admin, {
      businessAccountId,
      type: metadata.promotion_type as PromotionType,
      targetId: metadata.target_id,
      stripePaymentId: payment.provider_payment_id,
    });
  }

  await admin
    .from("payments")
    .update({
      metadata: {
        ...metadata,
        fulfilled: "true",
        feed_post_pack_granted:
          metadata.promotion_type === "feed_post"
            ? "true"
            : metadata.feed_post_pack_granted,
      },
    })
    .eq("id", payment.id);
}

async function markPaid(
  admin: AdminClient,
  payment: PaymentRow,
  ntpId: string | null
): Promise<PaymentRow | null> {
  const metadata = {
    ...metadataOf(payment.metadata),
    netopia_status: metadataOf(payment.metadata).netopia_status ?? "3",
  };
  const { data } = await admin
    .from("payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      provider_payment_id: ntpId ?? payment.provider_payment_id,
      metadata,
    })
    .eq("id", payment.id)
    .in("status", ["pending", "failed"])
    .select("*")
    .maybeSingle();
  return data;
}

export async function applyNetopiaPaymentUpdate(input: {
  orderId: string;
  status: number | null;
  ntpId?: string | null;
  amount?: number | null;
}): Promise<void> {
  if (!input.orderId || input.status == null) return;
  const admin = createAdminClient();
  const payment = await loadPayment(admin, input.orderId);
  if (!payment || payment.provider !== "netopia") return;

  if (input.ntpId && payment.provider_payment_id !== input.ntpId) {
    await admin
      .from("payments")
      .update({ provider_payment_id: input.ntpId })
      .eq("id", payment.id)
      .is("provider_payment_id", null);
    payment.provider_payment_id = input.ntpId;
  }

  if (PAID_STATUSES.has(input.status)) {
    if (!amountsMatch(payment.amount_cents, input.amount)) {
      console.error("[netopia] Amount mismatch", {
        orderId: payment.id,
        expected: payment.amount_cents,
        reported: input.amount,
      });
      await markFailed(admin, payment, input.status, input.ntpId ?? null);
      return;
    }

    if (payment.status === "paid") {
      await grantSideEffects(admin, payment);
      return;
    }
    if (payment.status !== "pending" && payment.status !== "failed") return;

    const paid = await markPaid(admin, payment, input.ntpId ?? null);
    if (!paid) {
      const current = await loadPayment(admin, payment.id);
      if (current?.status === "paid") await grantSideEffects(admin, current);
      return;
    }
    await grantSideEffects(admin, paid);
    return;
  }

  if (input.status === DECLINED_STATUS) {
    await recordDecline(admin, payment, input.ntpId ?? null);
    return;
  }

  if (FAIL_STATUSES.has(input.status)) {
    await markFailed(admin, payment, input.status, input.ntpId ?? null);
  }
}

export async function closeCanceledPayment(
  orderId: string,
  businessAccountId: string
): Promise<void> {
  const admin = createAdminClient();
  const payment = await loadPayment(admin, orderId);
  if (!payment || payment.provider !== "netopia") return;
  if (payment.business_account_id !== businessAccountId) return;
  if (payment.status !== "pending") return;
  await markFailed(admin, payment, 4, payment.provider_payment_id);
}

export function netopiaPayloadHash(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

export async function rememberNetopiaPayload(rawBody: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("netopia_webhook_events").insert({
    payload_hash: netopiaPayloadHash(rawBody),
  });
  if (!error) return false;
  if (error.code === "23505") return true;
  throw error;
}
