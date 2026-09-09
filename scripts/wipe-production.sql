-- Truncate all public application data. Auth users are deleted separately.
-- site_settings singleton is restored so the app still has a settings row.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> 'spatial_ref_sys'
  LOOP
    EXECUTE format('TRUNCATE TABLE public.%I CASCADE', r.tablename);
  END LOOP;
END $$;

DELETE FROM auth.users;

INSERT INTO public.site_settings (id, prelaunch_active, prelaunch_ends_at)
VALUES (1, false, null);
