-- Auto-enroll all users in the newsletter (opt-out model)

ALTER TABLE profiles
  ALTER COLUMN newsletter_opt_in SET DEFAULT true;

UPDATE profiles
SET newsletter_opt_in = true
WHERE newsletter_opt_in = false;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, newsletter_opt_in)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    true
  );
  RETURN NEW;
END;
$$;
