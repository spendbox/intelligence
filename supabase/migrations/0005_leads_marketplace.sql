-- Folio: leads marketplace
-- Businesses receive lead requests in their industry, pay credits to unlock contact info.

-- ── Business profiles ────────────────────────────────────────────────────────
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references users(id) on delete cascade,
  display_name text,
  slug text unique,
  bio text,
  business_name text,
  phone text,
  cac_number text,
  id_document_url text,
  cac_document_url text,
  verified boolean not null default false,
  setup_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists business_categories (
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (business_id, category_id)
);

create table if not exists business_locations (
  business_id uuid not null references businesses(id) on delete cascade,
  location text not null,
  primary key (business_id, location)
);

create table if not exists business_budget_ranges (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  budget_min int not null,
  budget_max int not null,
  check (budget_max >= budget_min),
  unique (business_id, budget_min, budget_max)
);

create table if not exists business_gallery (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ── Wallets / credits ────────────────────────────────────────────────────────
create table if not exists wallets (
  user_id uuid primary key references users(id) on delete cascade,
  credits int not null default 0,
  total_topup_naira int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('topup','unlock','refund','adjust')),
  reference text,
  naira_amount int,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists wallet_tx_user_idx on wallet_transactions (user_id, created_at desc);
create unique index if not exists wallet_tx_reference_uniq
  on wallet_transactions (reference) where reference is not null;

-- ── Lead requests (from clients submitting via /order) ───────────────────────
create table if not exists lead_requests (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  name text not null,
  phone text not null,
  description text not null,
  category_id uuid references categories(id) on delete set null,
  budget_min int not null,
  budget_max int not null,
  location text not null,
  status text not null default 'submitted'
    check (status in ('submitted','approved','rejected','closed')),
  unlock_credits int not null,
  unlocks_count int not null default 0,
  unlocks_cap int not null default 10,
  reject_reason text,
  approved_at timestamptz,
  approved_by text,
  created_at timestamptz not null default now()
);
create index if not exists lead_requests_status_idx on lead_requests (status, created_at desc);
create index if not exists lead_requests_category_idx on lead_requests (category_id);

create table if not exists lead_request_images (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references lead_requests(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

create table if not exists lead_notifications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references lead_requests(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (request_id, business_id)
);

create table if not exists lead_unlocks (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references lead_requests(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  credits_spent int not null,
  created_at timestamptz not null default now(),
  unique (request_id, business_id)
);
create index if not exists lead_unlocks_request_idx on lead_unlocks (request_id);

-- ── Order email verification ─────────────────────────────────────────────────
create table if not exists order_email_verifications (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists order_email_verifications_email_idx
  on order_email_verifications (email, expires_at desc);

-- Triggers to bump updated_at
create or replace function _touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists touch_businesses on businesses;
create trigger touch_businesses before update on businesses
  for each row execute function _touch_updated_at();

drop trigger if exists touch_wallets on wallets;
create trigger touch_wallets before update on wallets
  for each row execute function _touch_updated_at();
