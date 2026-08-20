-- Premium billing: reusable Stripe customer, one-time vs recurring Premium

ALTER TABLE business_accounts
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

ALTER TABLE subscriptions
  ALTER COLUMN stripe_subscription_id DROP NOT NULL;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billing_type TEXT NOT NULL DEFAULT 'recurring'
    CHECK (billing_type IN ('one_time', 'recurring'));

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
