-- Track whether admin issued a factura for a promotion or subscription period

ALTER TABLE promotions
  ADD COLUMN invoiced_at TIMESTAMPTZ,
  ADD COLUMN invoiced_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE subscriptions
  ADD COLUMN invoiced_at TIMESTAMPTZ,
  ADD COLUMN invoiced_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE POLICY "Admins update subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
