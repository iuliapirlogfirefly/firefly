-- Premium subscription: 1 newsletter inclusion per billing period

ALTER TABLE subscriptions
  ALTER COLUMN quota_newsletters SET DEFAULT 1;

UPDATE subscriptions
SET quota_newsletters = 1
WHERE quota_newsletters = 2;
