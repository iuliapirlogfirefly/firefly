/**
 * Find or create Firefly one-time promotion products/prices in the current
 * Stripe account (sandbox or live, depending on STRIPE_SECRET_KEY).
 *
 * Always uses RON. Does not reuse EUR prices.
 *
 * Usage: node scripts/stripe-sync-promotion-products.mjs
 */

import Stripe from "stripe";
import { loadScriptEnv } from "./load-env.mjs";

loadScriptEnv();

const secret = process.env.STRIPE_SECRET_KEY?.trim();
if (!secret) {
  console.error("Missing STRIPE_SECRET_KEY in .env.staging.local / .env.local");
  process.exit(1);
}

if (secret.startsWith("sk_live_")) {
  console.log("Mode: LIVE");
} else if (secret.startsWith("sk_test_")) {
  console.log("Mode: TEST / sandbox");
} else {
  console.log("Mode: unknown key type");
}

const stripe = new Stripe(secret);

const CATALOG = [
  {
    type: "event_boost",
    name: "Promoted Event",
    lookupKey: "firefly_event_boost_ron",
    amount: 15000,
    envVar: "STRIPE_EVENT_BOOST_PRICE_ID",
  },
  {
    type: "feed_post",
    name: "What Did You Miss? Post",
    lookupKey: "firefly_feed_post_ron",
    amount: 10000,
    envVar: "STRIPE_FEED_POST_PRICE_ID",
  },
  {
    type: "newsletter",
    name: "Newsletter Inclusion",
    lookupKey: "firefly_newsletter_ron",
    amount: 15000,
    envVar: "STRIPE_NEWSLETTER_PRICE_ID",
  },
  {
    type: "social_media",
    name: "Social Media Content",
    lookupKey: "firefly_social_media_ron",
    amount: 15000,
    envVar: "STRIPE_SOCIAL_MEDIA_PRICE_ID",
  },
];

async function findRonPrice(lookupKey, amount) {
  const listed = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  const existing = listed.data[0];
  if (!existing) return null;
  if (existing.currency !== "ron" || existing.unit_amount !== amount) {
    console.warn(
      `Skipping ${lookupKey}: existing price is ${existing.currency} ${existing.unit_amount}, expected ron ${amount}`
    );
    return null;
  }
  return existing;
}

async function findOrCreateProduct(item) {
  const listed = await stripe.products.list({ active: true, limit: 100 });
  const match = listed.data.find(
    (product) =>
      product.metadata?.promotion_type === item.type || product.name === item.name
  );
  if (match) return match;

  return stripe.products.create({
    name: item.name,
    metadata: { promotion_type: item.type },
  });
}

async function findOrCreatePrice(item) {
  const existing = await findRonPrice(item.lookupKey, item.amount);
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
    metadata: { promotion_type: item.type },
  });
  return { price, created: true };
}

console.log("\nPremium (existing):");
const premium = await stripe.products.list({ limit: 20 });
for (const product of premium.data.filter((p) => /premium/i.test(p.name))) {
  const prices = await stripe.prices.list({ product: product.id, limit: 10 });
  for (const price of prices.data) {
    const recurring = price.recurring ? `/${price.recurring.interval}` : " one-time";
    console.log(
      `  ${product.name} ${price.id} ${price.currency} ${price.unit_amount}${recurring} active=${price.active}`
    );
  }
}

console.log("\nPromotion prices:");
for (const item of CATALOG) {
  const { price, created } = await findOrCreatePrice(item);
  const action = created ? "created" : "existing";
  console.log(
    `${item.envVar}=${price.id}  # ${item.name} ${price.unit_amount / 100} ${price.currency.toUpperCase()} (${action})`
  );
}
