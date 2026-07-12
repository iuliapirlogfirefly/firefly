ALTER TABLE profiles
  ADD COLUMN nearby_events_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN nearby_lat DOUBLE PRECISION,
  ADD COLUMN nearby_lng DOUBLE PRECISION,
  ADD COLUMN nearby_radius_km INTEGER NOT NULL DEFAULT 5;

CREATE TABLE nearby_event_notifications (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE nearby_event_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own nearby notifications"
  ON nearby_event_notifications FOR SELECT
  USING (auth.uid() = user_id OR is_admin());
