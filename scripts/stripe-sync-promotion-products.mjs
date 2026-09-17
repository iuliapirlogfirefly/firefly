/**
 * Find or create Firefly promotion and Premium products/prices in the current
 * Stripe account (sandbox or live, depending on STRIPE_SECRET_KEY).
 *
 * Always uses RON. Does not reuse EUR prices.
 *
 * Usage:
 *   node scripts/stripe-sync-promotion-products.mjs
 *   node scripts/stripe-sync-promotion-products.mjs --env-file=.env.local
 *   STRIPE_ENV_FILE=.env.local npm run stripe:sync-promotions
 */

import Stripe from "stripe";
import { loadScriptEnv } from "./load-env.mjs";

const envFileArg = process.argv.find((arg) => arg.startsWith("--env-file="));
const envFile = envFileArg
  ? envFileArg.slice("--env-file=".length)
  : process.env.STRIPE_ENV_FILE;

loadScriptEnv({ envFile });

const secret = process.env.STRIPE_SECRET_KEY?.trim();
if (!secret) {
  console.error(
    "Missing STRIPE_SECRET_KEY. Pass --env-file=.env.local for live keys, or set it in .env.staging.local / .env.local"
  );
  process.exit(1);
}

if (secret.startsWith("pk_")) {
  console.error(
    "STRIPE_SECRET_KEY is a publishable key (pk_). Use the Secret key (sk_ or rk_), not NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY."
  );
  process.exit(1);
}

if (secret.startsWith("sk_live_") || secret.startsWith("rk_live_")) {
  console.log("Mode: LIVE");
} else if (secret.startsWith("sk_test_") || secret.startsWith("rk_test_")) {
  console.log("Mode: TEST / sandbox");
} else {
  console.log("Mode: unknown key type");
}

const stripe = new Stripe(secret);

const PROMOTION_CATALOG = [
  {
    type: "event_boost",
    name: "Promoted Event",
    lookupKey: "firefly_event_boost_ron",
    amount: 15000,
    envVar: "STRIPE_EVENT_BOOST_PRICE_ID",
    metadata: { promotion_type: "event_boost" },
  },
  {
    type: "feed_post",
    name: "What Did You Miss? Pack (4 posts)",
    lookupKey: "firefly_feed_post_ron",
    amount: 10000,
    envVar: "STRIPE_FEED_POST_PRICE_ID",
    metadata: { promotion_type: "feed_post" },
  },
  {
    type: "newsletter",
    name: "Newsletter Inclusion",
    lookupKey: "firefly_newsletter_ron",
    amount: 15000,
    envVar: "STRIPE_NEWSLETTER_PRICE_ID",
    metadata: { promotion_type: "newsletter" },
  },
  {
    type: "social_media",
    name: "Social Media Content",
    lookupKey: "firefly_social_media_ron",
    amount: 15000,
    envVar: "STRIPE_SOCIAL_MEDIA_PRICE_ID",
    metadata: { promotion_type: "social_media" },
  },
];

const PREMIUM_CATALOG = [
  {
    name: "Firefly Premium",
    lookupKey: "firefly_premium_onetime_ron",
    amount: 50000,
    envVar: "STRIPE_PREMIUM_ONETIME_PRICE_ID",
    metadata: { product: "premium" },
  },
  {
    name: "Firefly Premium",
    lookupKey: "firefly_premium_subscription_ron",
    amount: 50000,
    envVar: "STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID",
    recurring: { interval: "month" },
    metadata: { product: "premium" },
  },
];

async function findRonPrice(lookupKey, amount, recurringInterval) {
  const listed = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  const existing = listed.data[0];
  if (!existing) return null;
  const interval = existing.recurring?.interval ?? null;
  const expectedInterval = recurringInterval ?? null;
  if (
    existing.currency !== "ron" ||
    existing.unit_amount !== amount ||
    interval !== expectedInterval
  ) {
    console.warn(
      `Skipping ${lookupKey}: existing price is ${existing.currency} ${existing.unit_amount} ${interval ?? "one-time"}, expected ron ${amount} ${expectedInterval ?? "one-time"}`
    );
    return null;
  }
  return existing;
}

async function findOrCreateProduct(item) {
  const listed = await stripe.products.list({ active: true, limit: 100 });
  const match = listed.data.find((product) => {
    if (item.type) {
      return (
        product.metadata?.promotion_type === item.type || product.name === item.name
      );
    }
    if (item.metadata?.product) {
      return (
        product.metadata?.product === item.metadata.product ||
        product.name === item.name
      );
    }
    return product.name === item.name;
  });
  if (match) {
    if (match.name !== item.name || JSON.stringify(match.metadata ?? {}) !== JSON.stringify(item.metadata ?? {})) {
      await stripe.products.update(match.id, {
        name: item.name,
        metadata: item.metadata,
      });
      return { ...match, name: item.name, metadata: item.metadata };
    }
    return match;
  }

  return stripe.products.create({
    name: item.name,
    metadata: item.metadata,
  });
}

async function findOrCreatePrice(item) {
  const existing = await findRonPrice(
    item.lookupKey,
    item.amount,
    item.recurring?.interval
  );
  if (existing) {
    return { price: existing, created: false };
  }

  const product = await findOrCreateProduct(item);
  const price = await stripe.prices.create({
    product: product.id,
    currency: "ron",
    unit_amount: item.amount,
    lookup_key: item.lookupKey,
    transfer_lookup_key: true,
    metadata: item.metadata,
    ...(item.recurring ? { recurring: item.recurring } : {}),
  });
  return { price, created: true };
}

console.log("\nPremium prices:");
for (const item of PREMIUM_CATALOG) {
  const { price, created } = await findOrCreatePrice(item);
  const action = created ? "created" : "existing";
  const interval = price.recurring ? `/${price.recurring.interval}` : " one-time";
  console.log(
    `${item.envVar}=${price.id}  # ${item.name} ${price.unit_amount / 100} ${price.currency.toUpperCase()}${interval} (${action})`
  );
}

console.log("\nPromotion prices:");
for (const item of PROMOTION_CATALOG) {
  const { price, created } = await findOrCreatePrice(item);
  const action = created ? "created" : "existing";
  console.log(
    `${item.envVar}=${price.id}  # ${item.name} ${price.unit_amount / 100} ${price.currency.toUpperCase()} (${action})`
  );
}
