-- Admin dashboard improvements: billing fields, published_at, cancel_at_period_end, newsletter-media

-- Business billing / fiscal details
ALTER TABLE business_accounts
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS cui TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS billing_city TEXT,
  ADD COLUMN IF NOT EXISTS billing_county TEXT,
  ADD COLUMN IF NOT EXISTS billing_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS billing_country TEXT NOT NULL DEFAULT 'RO';

-- Event publish timestamp
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

UPDATE events
SET published_at = COALESCE(updated_at, created_at)
WHERE status = 'published' AND published_at IS NULL;

CREATE INDEX IF NOT EXISTS events_published_at_idx
  ON events (published_at DESC NULLS LAST);

-- Subscription cancel-at-period-end flag
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;

-- Newsletter media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('newsletter-media', 'newsletter-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read newsletter media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'newsletter-media');

CREATE POLICY "Authenticated upload newsletter media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'newsletter-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update own newsletter media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'newsletter-media' AND auth.uid() = owner);

CREATE POLICY "Authenticated delete own newsletter media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'newsletter-media' AND auth.uid() = owner);
