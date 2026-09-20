-- Ensure business event edits cannot self-publish. Drafts stay drafts,
-- pending/rejected stay in the review flow, and published edits must
-- return to pending so admin approval is required before going live again.

CREATE INDEX IF NOT EXISTS events_business_account_id_idx
  ON events (business_account_id);

DROP POLICY IF EXISTS "Business creates events" ON events;
DROP POLICY IF EXISTS "Business updates own events" ON events;

CREATE POLICY "Business creates events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    (select is_admin())
    OR (
      business_account_id = (select current_business_account_id())
      AND status IN ('draft', 'pending')
    )
  );

CREATE POLICY "Business updates own events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    business_account_id = (select current_business_account_id())
    OR (select is_admin())
  )
  WITH CHECK (
    (select is_admin())
    OR (
      business_account_id = (select current_business_account_id())
      AND status IN ('draft', 'pending', 'rejected')
    )
  );
