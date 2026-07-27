-- Ensure business feed-post edits cannot self-publish; status must stay pending
-- so admin approval is required after create or edit.

DROP POLICY IF EXISTS "Business updates own feed posts" ON feed_posts;

CREATE POLICY "Business updates own feed posts"
  ON feed_posts FOR UPDATE
  USING (business_account_id = current_business_account_id() OR is_admin())
  WITH CHECK (
    is_admin()
    OR (
      business_account_id = current_business_account_id()
      AND status = 'pending'
    )
  );
