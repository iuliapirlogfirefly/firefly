import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ received: true, skipped: "supabase_disabled" });
  }

  const { getStripe } = await import("@/lib/stripe/client");
  const {
    handleCheckoutCompleted,
    handleInvoicePaid,
    handleSubscriptionUpdated,
    isWebhookProcessed,
    markWebhookProcessed,
  } = await import("@/lib/stripe/webhooks");

  const body = await request.text();
  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (await isWebhookProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session
      );
      break;
    case "invoice.payment_succeeded":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case "customer.subscription.updated":
    case "customer.subscription.created":
      await handleSubscriptionUpdated(
        event.data.object as Stripe.Subscription
      );
      break;
  }

  await markWebhookProcessed(event.id);
  return NextResponse.json({ received: true });
}
