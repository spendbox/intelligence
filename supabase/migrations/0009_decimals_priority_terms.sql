-- Folio: decimal credits, priority requests, terms acceptance

-- 1. Decimal credit columns (allow 1.5, 2.7 etc)
alter table wallets
  alter column credits type numeric(14,2) using credits::numeric(14,2);
alter table wallet_transactions
  alter column delta type numeric(14,2) using delta::numeric(14,2);
alter table lead_requests
  alter column unlock_credits type numeric(10,2) using unlock_credits::numeric(10,2);
alter table lead_unlocks
  alter column credits_spent type numeric(10,2) using credits_spent::numeric(10,2);

-- 2. Priority requests
alter table lead_requests
  add column if not exists is_priority boolean not null default false,
  add column if not exists priority_amount_naira int,
  add column if not exists priority_paid boolean not null default false,
  add column if not exists priority_paid_at timestamptz,
  add column if not exists priority_reference text;

-- 3. Request image table already exists. Nothing to add.

-- 4. Terms acceptance
alter table users
  add column if not exists terms_accepted_at timestamptz;
alter table lead_requests
  add column if not exists terms_accepted_at timestamptz;
