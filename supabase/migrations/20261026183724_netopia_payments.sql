-- NETOPIA ledger columns. Historical Stripe ids stay on existing rows.

ALTER TABLE payments
  ADD COLUMN provider TEXT NOT NULL DEFAULT 'stripe'
    CHECK (provider IN ('stripe', 'netopia')),
  ADD COLUMN provider_order_id TEXT,
  ADD COLUMN provider_payment_id TEXT;

ALTER TABLE payments
  ALTER COLUMN paid_at DROP NOT NULL;

CREATE UNIQUE INDEX payments_provider_order_idx
  ON payments (provider_order_id)
  WHERE provider_order_id IS NOT NULL;

CREATE UNIQUE INDEX payments_provider_payment_idx
  ON payments (provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

ALTER TABLE subscriptions
  ALTER COLUMN stripe_customer_id DROP NOT NULL;

CREATE TABLE netopia_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload_hash TEXT NOT NULL UNIQUE,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE netopia_webhook_events ENABLE ROW LEVEL SECURITY;
