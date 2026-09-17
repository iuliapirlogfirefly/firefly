-- What Did You Miss posting credits: Premium quota (subscriptions.quota_feed_posts)
-- plus one-time 4-post packs on business_accounts. Businesses can no longer INSERT
-- feed_posts via the Data API; the service role consumes a credit then inserts.

ALTER TABLE business_accounts
  ADD COLUMN addon_feed_posts_quota INTEGER NOT NULL DEFAULT 0
    CHECK (addon_feed_posts_quota >= 0),
  ADD COLUMN addon_feed_posts_used INTEGER NOT NULL DEFAULT 0
    CHECK (addon_feed_posts_used >= 0);

ALTER TABLE business_accounts
  ADD CONSTRAINT business_accounts_addon_feed_posts_used_lte_quota
  CHECK (addon_feed_posts_used <= addon_feed_posts_quota);

REVOKE UPDATE (addon_feed_posts_quota, addon_feed_posts_used)
  ON business_accounts
  FROM anon, authenticated;

DROP POLICY IF EXISTS "Business submits feed posts" ON feed_posts;

CREATE OR REPLACE FUNCTION consume_feed_post_credit(p_business_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET
    used_feed_posts = used_feed_posts + 1,
    updated_at = now()
  WHERE business_account_id = p_business_id
    AND used_feed_posts < quota_feed_posts
    AND status IN ('active', 'past_due', 'trialing')
    AND current_period_end > now();

  IF FOUND THEN
    RETURN 'premium';
  END IF;

  UPDATE business_accounts
  SET
    addon_feed_posts_used = addon_feed_posts_used + 1,
    updated_at = now()
  WHERE id = p_business_id
    AND addon_feed_posts_used < addon_feed_posts_quota;

  IF FOUND THEN
    RETURN 'addon';
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION restore_feed_post_credit(p_business_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Reverse of consume: addon last-in is restored first, then Premium.
  UPDATE business_accounts
  SET
    addon_feed_posts_used = addon_feed_posts_used - 1,
    updated_at = now()
  WHERE id = p_business_id
    AND addon_feed_posts_used > 0;

  IF FOUND THEN
    RETURN 'addon';
  END IF;

  UPDATE subscriptions
  SET
    used_feed_posts = used_feed_posts - 1,
    updated_at = now()
  WHERE business_account_id = p_business_id
    AND used_feed_posts > 0;

  IF FOUND THEN
    RETURN 'premium';
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION grant_feed_post_pack(
  p_business_id uuid,
  p_count integer
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF p_count IS NULL OR p_count <= 0 THEN
    RAISE EXCEPTION 'pack count must be positive';
  END IF;

  UPDATE business_accounts
  SET
    addon_feed_posts_quota = addon_feed_posts_quota + p_count,
    updated_at = now()
  WHERE id = p_business_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'business account not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION consume_feed_post_credit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION restore_feed_post_credit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION grant_feed_post_pack(uuid, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION consume_feed_post_credit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION restore_feed_post_credit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION grant_feed_post_pack(uuid, integer) TO service_role;
