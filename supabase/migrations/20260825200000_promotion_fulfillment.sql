-- Track ops fulfillment for social_media and newsletter promotions

ALTER TABLE promotions
  ADD COLUMN fulfilled_at TIMESTAMPTZ,
  ADD COLUMN fulfilled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN delivery_url TEXT,
  ADD COLUMN delivery_notes TEXT;

CREATE INDEX promotions_fulfillment_idx
  ON promotions (type, fulfilled_at, created_at DESC)
  WHERE type IN ('social_media', 'newsletter');

CREATE POLICY "Admins update promotions"
  ON promotions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
