import Stripe from "stripe";

let stripe: Stripe | null = null;
let stripeKeyUsed: string | null = null;

/** Split names so Next.js cannot replace this with a build-time constant. */
function runtimeEnv(parts: readonly string[]): string {
  return String(process.env[parts.join("_")] ?? "").trim();
}

function readStripeSecretKey(): string {
  return runtimeEnv(["STRIPE", "SECRET", "KEY"]);
}

function readStripePublishableKey(): string {
  return runtimeEnv(["NEXT", "PUBLIC", "STRIPE", "PUBLISHABLE", "KEY"]);
}

export function stripeSecretKeyPrefix(): string {
  const key = readStripeSecretKey();
  return key ? key.slice(0, 8) : "missing";
}

function getStripeSecretKey(): string {
  const key = readStripeSecretKey();
  const publishable = readStripePublishableKey();

  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set on this Vercel environment (Preview vs Production are separate from .env.local)."
    );
  }
  if (publishable && key === publishable) {
    throw new Error(
      `STRIPE_SECRET_KEY is the same value as NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ("${key.slice(0, 8)}"). Paste the Secret key (sk_ / rk_), not the Publishable key.`
    );
  }
  if (key.startsWith("pk_")) {
    throw new Error(
      `STRIPE_SECRET_KEY starts with "${key.slice(0, 8)}" (publishable). Replace it on Vercel with the Secret key (sk_live_ / sk_test_ / rk_), then redeploy this Git commit.`
    );
  }
  if (!key.startsWith("sk_") && !key.startsWith("rk_")) {
    throw new Error(
      `STRIPE_SECRET_KEY starts with "${key.slice(0, 8)}" and is invalid. It must start with sk_ or rk_.`
    );
  }
  return key;
}

export function explainStripeError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : fallback;
  if (
    !message.includes("publishable API key") &&
    !message.includes("Invalid API Key") &&
    !message.includes("STRIPE_SECRET_KEY")
  ) {
    return message;
  }
  return `${message} (this deployment loaded STRIPE_SECRET_KEY as "${stripeSecretKeyPrefix()}")`;
}

export function getStripe(): Stripe {
  const key = getStripeSecretKey();
  if (!stripe || stripeKeyUsed !== key) {
    stripe = new Stripe(key, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
    });
    stripeKeyUsed = key;
  }
  return stripe;
}
