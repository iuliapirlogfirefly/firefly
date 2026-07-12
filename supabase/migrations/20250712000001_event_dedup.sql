CREATE TABLE event_duplicate_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id_a UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_id_b UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  dismissed_by UUID REFERENCES profiles(id),
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_pair_ordered CHECK (event_id_a < event_id_b),
  UNIQUE (event_id_a, event_id_b)
);

ALTER TABLE event_duplicate_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages duplicate dismissals"
  ON event_duplicate_dismissals FOR ALL USING (is_admin());
