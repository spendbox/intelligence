-- Intelligence platform — initial schema
create extension if not exists "pgcrypto";
create extension if not exists "citext";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email citext unique not null,
  created_at timestamptz not null default now(),
  trial_ends_at timestamptz not null,
  status text not null default 'trialing' check (status in ('trialing','active','canceled')),
  provider_customer_id text
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists user_categories (
  user_id uuid not null references users(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

create table if not exists login_pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  pin_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists login_pins_user_expires_idx on login_pins (user_id, expires_at desc);

create table if not exists insight_drafts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  subject text not null,
  body_md text not null,
  body_html text not null,
  status text not null default 'draft' check (status in ('draft','scheduled','sent')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists insight_drafts_status_sched_idx on insight_drafts (status, scheduled_for);

create table if not exists email_deliveries (
  id uuid primary key default gen_random_uuid(),
  insight_id uuid not null references insight_drafts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  resend_message_id text,
  status text not null default 'queued' check (status in ('queued','sent','delivered','bounced','failed','complained','opened','clicked')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists email_deliveries_insight_idx on email_deliveries (insight_id);
create index if not exists email_deliveries_user_idx on email_deliveries (user_id);

-- Starter category seeds (admin can edit/disable later)
insert into categories (slug, name, description) values
  ('cashflow', 'Cash Flow', 'Monthly cash flow insights and benchmarks.'),
  ('marketing', 'Marketing', 'Marketing channels and ROI insights.'),
  ('operations', 'Operations', 'Operational efficiency and cost insights.'),
  ('hr', 'People & HR', 'Hiring, retention and team insights.'),
  ('tech', 'Technology', 'Tech-stack and automation insights.')
on conflict (slug) do nothing;
