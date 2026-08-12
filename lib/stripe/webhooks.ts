import { createAdminClient } from "@/lib/supabase/admin";
import { SUBSCRIPTION_QUOTAS } from "./products";
import { activatePromotion } from "./activate-promotion";
import type { PromotionType } from "@/types";
import type Stripe from "stripe";

type InvoiceWebhookData = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
  payment_intent?: string | Stripe.PaymentIntent | null;
};

function getSubscriptionId(invoice: InvoiceWebhookData): string | null {
  if (!invoice.subscription) return null;
  return typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription.id;
}

function getPaymentIntentId(invoice: InvoiceWebhookData): string | null {
  if (!invoice.payment_intent) return null;
  return typeof invoice.payment_intent === "string"
    ? invoice.payment_intent
    : invoice.payment_intent.id;
}

async function recordPayment(
  admin: ReturnType<typeof createAdminClient>,
  payload: {
    businessAccountId: string;
    stripeCheckoutSessionId?: string | null;
    stripePaymentIntentId?: string | null;
    stripeInvoiceId?: string | null;
    type: "one_time" | "subscription";
    productType: string;
    amountCents: number;
    currency: string;
    paidAt?: string;
    metadata?: Record<string, string>;
  }
) {
  if (payload.stripePaymentIntentId) {
    await admin.from("payments").upsert(
      {
        business_account_id: payload.businessAccountId,
        stripe_checkout_session_id: payload.stripeCheckoutSessionId ?? null,
        stripe_payment_intent_id: payload.stripePaymentIntentId,
        stripe_invoice_id: payload.stripeInvoiceId ?? null,
        type: payload.type,
        product_type: payload.productType,
        amount_cents: payload.amountCents,
        currency: payload.currency,
        paid_at: payload.paidAt ?? new Date().toISOString(),
        metadata: payload.metadata ?? {},
      },
      { onConflict: "stripe_payment_intent_id" }
    );
    return;
  }

  if (payload.stripeInvoiceId) {
    await admin.from("payments").upsert(
      {
        business_account_id: payload.businessAccountId,
        stripe_checkout_session_id: payload.stripeCheckoutSessionId ?? null,
        stripe_payment_intent_id: null,
        stripe_invoice_id: payload.stripeInvoiceId,
        type: payload.type,
        product_type: payload.productType,
        amount_cents: payload.amountCents,
        currency: payload.currency,
        paid_at: payload.paidAt ?? new Date().toISOString(),
        metadata: payload.metadata ?? {},
      },
      { onConflict: "stripe_invoice_id" }
    );
  }
}

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const admin = createAdminClient();
  const metadata = session.metadata ?? {};
  const businessAccountId = metadata.business_account_id;
  const promotionType = metadata.promotion_type;
  const targetId = metadata.target_id;

  if (!businessAccountId) return;

  if (
    session.mode === "payment" &&
    session.amount_total != null &&
    session.payment_intent
  ) {
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id;

    await recordPayment(admin, {
      businessAccountId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      type: "one_time",
      productType: promotionType ?? "promotion",
      amountCents: session.amount_total,
      currency: session.currency ?? "eur",
      metadata,
    });
  }

  if (!promotionType || !targetId) return;

  const paymentIntentId =
    session.payment_intent == null
      ? null
      : typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id;

  await activatePromotion(admin, {
    businessAccountId,
    type: promotionType as PromotionType,
    targetId,
    stripePaymentId: paymentIntentId,
  });
}

export async function handleInvoicePaid(
  invoice: Stripe.Invoice
): Promise<void> {
  const admin = createAdminClient();
  const invoiceData = invoice as InvoiceWebhookData;

  if (!invoiceData.id || invoiceData.amount_paid == null) return;

  const subscriptionId = getSubscriptionId(invoiceData);

  let businessAccountId: string | undefined;

  if (subscriptionId) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("business_account_id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();
    businessAccountId = sub?.business_account_id ?? undefined;
  }

  if (!businessAccountId) return;

  const paymentIntentId = getPaymentIntentId(invoiceData);

  const paidAt = invoiceData.status_transitions?.paid_at
    ? new Date(invoiceData.status_transitions.paid_at * 1000).toISOString()
    : new Date().toISOString();

  await recordPayment(admin, {
    businessAccountId,
    stripePaymentIntentId: paymentIntentId ?? undefined,
    stripeInvoiceId: invoiceData.id,
    type: "subscription",
    productType: "subscription",
    amountCents: invoiceData.amount_paid,
    currency: invoiceData.currency ?? "eur",
    paidAt,
  });
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const admin = createAdminClient();
  const businessAccountId = subscription.metadata.business_account_id;
  if (!businessAccountId) return;

  const item = subscription.items.data[0];
  const periodStart = new Date(
    (item?.current_period_start ?? Math.floor(Date.now() / 1000)) * 1000
  );
  const periodEnd = new Date(
    (item?.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000
  );

  const { data: existing } = await admin
    .from("subscriptions")
    .select("current_period_start")
    .eq("business_account_id", businessAccountId)
    .maybeSingle();

  const periodChanged =
    !existing?.current_period_start ||
    new Date(existing.current_period_start).getTime() !== periodStart.getTime();

  const usageReset = periodChanged
    ? {
        used_promoted_events: 0,
        used_feed_posts: 0,
        used_newsletters: 0,
        used_social_posts: 0,
      }
    : {};

  await admin.from("subscriptions").upsert(
    {
      business_account_id: businessAccountId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      ...SUBSCRIPTION_QUOTAS,
      ...usageReset,
    },
    { onConflict: "business_account_id" }
  );
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const admin = createAdminClient();
  const businessAccountId = subscription.metadata.business_account_id;
  if (!businessAccountId) {
    await admin
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);
    return;
  }

  await admin
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("business_account_id", businessAccountId);
}

export async function isWebhookProcessed(
  stripeEventId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("stripe_webhook_events")
    .select("id")
    .eq("stripe_event_id", stripeEventId)
    .maybeSingle();
  return !!data;
}

export async function markWebhookProcessed(
  stripeEventId: string
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("stripe_webhook_events")
    .insert({ stripe_event_id: stripeEventId });
}
