import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "./client";
import { getBusinessBillingContact } from "./customer";
import { addOneMonth } from "./entitlement";
import { PREMIUM_PRODUCT, SUBSCRIPTION_QUOTAS } from "./products";
import { activatePromotion } from "./activate-promotion";
import {
  sendPremiumPaymentFailedEmail,
  sendPremiumUnpaidEmail,
} from "@/lib/notifications/email";
import type { PromotionType } from "@/types";
import type Stripe from "stripe";

type InvoiceWebhookData = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
  payment_intent?: string | Stripe.PaymentIntent | null;
  parent?: {
    subscription_details?: {
      subscription?: string | Stripe.Subscription | null;
    } | null;
  } | null;
};

function getSubscriptionId(invoice: InvoiceWebhookData): string | null {
  const fromLegacy = invoice.subscription;
  if (fromLegacy) {
    return typeof fromLegacy === "string" ? fromLegacy : fromLegacy.id;
  }
  const fromParent = invoice.parent?.subscription_details?.subscription;
  if (!fromParent) return null;
  return typeof fromParent === "string" ? fromParent : fromParent.id;
}

function getPaymentIntentId(invoice: InvoiceWebhookData): string | null {
  if (!invoice.payment_intent) return null;
  return typeof invoice.payment_intent === "string"
    ? invoice.payment_intent
    : invoice.payment_intent.id;
}

function getCustomerId(
  source: { customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null }
): string | null {
  if (!source.customer) return null;
  return typeof source.customer === "string"
    ? source.customer
    : source.customer.id;
}

async function resolveBusinessAccountId(
  admin: ReturnType<typeof createAdminClient>,
  params: {
    metadataId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string | null;
  }
): Promise<string | null> {
  if (params.metadataId) return params.metadataId;

  if (params.stripeSubscriptionId) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("business_account_id")
      .eq("stripe_subscription_id", params.stripeSubscriptionId)
      .maybeSingle();
    if (sub?.business_account_id) return sub.business_account_id;
  }

  if (params.stripeCustomerId) {
    const { data: business } = await admin
      .from("business_accounts")
      .select("id")
      .eq("stripe_customer_id", params.stripeCustomerId)
      .maybeSingle();
    if (business?.id) return business.id;
  }

  return null;
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

async function activateOneTimePremium(
  admin: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
  businessAccountId: string
) {
  const customerId = getCustomerId(session);
  if (!customerId) return;

  const now = new Date();
  const periodEnd = addOneMonth(now);
  const metadata = session.metadata ?? {};
  const paymentIntentId =
    session.payment_intent == null
      ? null
      : typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id;

  if (session.amount_total != null && paymentIntentId) {
    await recordPayment(admin, {
      businessAccountId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      type: "one_time",
      productType: PREMIUM_PRODUCT,
      amountCents: session.amount_total,
      currency: session.currency ?? "ron",
      metadata,
    });
  }

  await admin.from("subscriptions").upsert(
    {
      business_account_id: businessAccountId,
      stripe_subscription_id: null,
      stripe_customer_id: customerId,
      status: "active",
      billing_type: "one_time",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: true,
      terms_accepted_at: metadata.terms_accepted_at || now.toISOString(),
      ...SUBSCRIPTION_QUOTAS,
      used_promoted_events: 0,
      used_feed_posts: 0,
      used_newsletters: 0,
      used_social_posts: 0,
    },
    { onConflict: "business_account_id" }
  );

  await admin
    .from("business_accounts")
    .update({
      stripe_customer_id: customerId,
      updated_at: now.toISOString(),
    })
    .eq("id", businessAccountId)
    .is("stripe_customer_id", null);
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

  if (session.mode === "payment" && metadata.product === PREMIUM_PRODUCT) {
    await activateOneTimePremium(admin, session, businessAccountId);
    return;
  }

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
  const businessAccountId = await resolveBusinessAccountId(admin, {
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: getCustomerId(invoiceData),
  });

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
    currency: invoiceData.currency ?? "ron",
    paidAt,
  });
}

export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const admin = createAdminClient();
  const invoiceData = invoice as InvoiceWebhookData;
  const subscriptionId = getSubscriptionId(invoiceData);
  if (!subscriptionId) return;

  const businessAccountId = await resolveBusinessAccountId(admin, {
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: getCustomerId(invoiceData),
  });
  if (!businessAccountId) return;

  try {
    const stripeSubscription = await getStripe().subscriptions.retrieve(
      subscriptionId
    );
    await admin
      .from("subscriptions")
      .update({
        status: stripeSubscription.status,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("business_account_id", businessAccountId);
  } catch (error) {
    console.warn("[stripe] Failed to sync subscription after payment failure", error);
    await admin
      .from("subscriptions")
      .update({
        status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("business_account_id", businessAccountId);
  }

  const contact = await getBusinessBillingContact(businessAccountId);
  if (!contact?.email) return;

  const amountCents = invoiceData.amount_due ?? invoiceData.amount_remaining ?? 50000;
  const currency = invoiceData.currency ?? "ron";

  await sendPremiumPaymentFailedEmail(
    contact.email,
    amountCents,
    currency,
    contact.locale
  ).catch((error) => {
    console.warn("[stripe] Failed to send payment-failed email", error);
  });
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const admin = createAdminClient();
  const businessAccountId = await resolveBusinessAccountId(admin, {
    metadataId: subscription.metadata.business_account_id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: getCustomerId(subscription),
  });
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
    .select("current_period_start, status")
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

  const termsAcceptedAt = subscription.metadata.terms_accepted_at;

  await admin.from("subscriptions").upsert(
    {
      business_account_id: businessAccountId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      billing_type: "recurring",
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      ...(termsAcceptedAt ? { terms_accepted_at: termsAcceptedAt } : {}),
      ...SUBSCRIPTION_QUOTAS,
      ...usageReset,
    },
    { onConflict: "business_account_id" }
  );

  const customerId = getCustomerId(subscription);
  if (customerId) {
    await admin
      .from("business_accounts")
      .update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessAccountId)
      .is("stripe_customer_id", null);
  }

  if (existing?.status !== "unpaid" && subscription.status === "unpaid") {
    const contact = await getBusinessBillingContact(businessAccountId);
    if (contact?.email) {
      await sendPremiumUnpaidEmail(contact.email, contact.locale).catch(
        (error) => {
          console.warn("[stripe] Failed to send unpaid email", error);
        }
      );
    }
  }
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const admin = createAdminClient();
  const businessAccountId = await resolveBusinessAccountId(admin, {
    metadataId: subscription.metadata.business_account_id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: getCustomerId(subscription),
  });
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
