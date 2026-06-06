-- Folio: settings + subscription tracking
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value) values
  ('paystack_enabled', 'false'::jsonb),
  ('price_monthly_kobo', '500000'::jsonb),
  ('price_yearly_kobo',  '5000000'::jsonb),
  ('currency', '"NGN"'::jsonb)
on conflict (key) do nothing;

alter table users add column if not exists subscription_ends_at timestamptz;
alter table users add column if not exists subscription_plan text;

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  reference text unique not null,
  plan text not null check (plan in ('monthly','yearly')),
  amount_kobo int not null,
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending','success','failed','abandoned')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);
create index if not exists payments_user_idx on payments (user_id);
