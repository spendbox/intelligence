-- Folio: Discover (scan-the-web-for-leads) feature
-- Adds two tables for prospecting runs + their public-web hits, and widens
-- the wallet_transactions reason enum so scans can be metered like unlocks.

create table if not exists discovered_scans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  status text not null default 'running'
    check (status in ('running','completed','failed')),
  query jsonb,
  results_count int not null default 0,
  credits_spent int not null default 0,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists discovered_scans_business_idx
  on discovered_scans (business_id, started_at desc);

create table if not exists discovered_leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  scan_id uuid not null references discovered_scans(id) on delete cascade,
  title text not null,
  summary text,
  source_url text not null,
  source_domain text,
  location text,
  budget_hint text,
  contact_hint text,
  posted_at timestamptz,
  score numeric,
  created_at timestamptz not null default now(),
  dismissed_at timestamptz,
  unique (business_id, source_url)
);
create index if not exists discovered_leads_business_idx
  on discovered_leads (business_id, created_at desc);

-- Widen wallet_transactions.reason to include 'scan' (refund still covers
-- both unlock-refunds and scan-refunds — no new reason needed for that).
alter table wallet_transactions drop constraint if exists wallet_transactions_reason_check;
alter table wallet_transactions add constraint wallet_transactions_reason_check
  check (reason in ('topup','unlock','refund','adjust','scan'));
