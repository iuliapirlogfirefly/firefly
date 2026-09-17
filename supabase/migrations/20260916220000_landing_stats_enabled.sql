-- Admin toggle for live landing-page stats. Off until the numbers look real.

ALTER TABLE site_settings
  ADD COLUMN landing_stats_enabled BOOLEAN NOT NULL DEFAULT false;
