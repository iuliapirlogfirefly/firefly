-- Keep accounting rows when a business account is deleted.
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT con.conname
  INTO fk_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'payments'
    AND con.contype = 'f'
    AND pg_get_constraintdef(con.oid) ILIKE '%business_account_id%'
    AND pg_get_constraintdef(con.oid) ILIKE '%business_accounts%';

  IF fk_name IS NULL THEN
    RAISE EXCEPTION 'payments.business_account_id foreign key not found';
  END IF;

  EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', fk_name);
END $$;

ALTER TABLE payments
  ALTER COLUMN business_account_id DROP NOT NULL;

ALTER TABLE payments
  ADD CONSTRAINT payments_business_account_id_fkey
  FOREIGN KEY (business_account_id)
  REFERENCES business_accounts(id)
  ON DELETE SET NULL;
