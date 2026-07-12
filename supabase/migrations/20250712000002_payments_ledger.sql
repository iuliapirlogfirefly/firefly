CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES business_accounts(id),
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('one_time', 'subscription')),
  product_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'paid',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payments_stripe_pi_idx ON payments(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE UNIQUE INDEX payments_stripe_invoice_idx ON payments(stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin reads payments"
  ON payments FOR SELECT USING (is_admin());
