-- Allow businesses to delete their own events and feed posts.

CREATE POLICY "Business deletes own events"
  ON events FOR DELETE
  TO authenticated
  USING (business_account_id = current_business_account_id());

CREATE POLICY "Business deletes own feed posts"
  ON feed_posts FOR DELETE
  TO authenticated
  USING (
    business_account_id = current_business_account_id()
    OR is_admin()
  );
