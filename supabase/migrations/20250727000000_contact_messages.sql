-- Business → admin support contact messages

CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread'
    CHECK (status IN ('unread', 'read', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX contact_messages_status_created_idx
  ON contact_messages (status, created_at DESC);

CREATE INDEX contact_messages_business_created_idx
  ON contact_messages (business_account_id, created_at DESC);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business inserts own contact messages"
  ON contact_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    business_account_id = current_business_account_id()
    AND profile_id = (SELECT auth.uid())
  );

CREATE POLICY "Business reads own contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (
    business_account_id = current_business_account_id()
    OR is_admin()
  );

CREATE POLICY "Admins update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
