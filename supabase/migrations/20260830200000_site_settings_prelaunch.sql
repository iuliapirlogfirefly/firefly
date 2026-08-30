-- Singleton site settings. Admins control the pre-launch countdown from the panel.

CREATE TABLE site_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  prelaunch_active BOOLEAN NOT NULL DEFAULT false,
  prelaunch_ends_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO site_settings (id, prelaunch_active, prelaunch_ends_at)
VALUES (1, false, null);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

GRANT SELECT ON TABLE site_settings TO anon, authenticated;
GRANT UPDATE ON TABLE site_settings TO authenticated;
