-- Folio: user-set PIN
alter table users add column if not exists pin_hash text;
alter table users add column if not exists first_login_at timestamptz;

-- Login pin codes are now also used for PIN reset / first-time setup.
alter table login_pins add column if not exists purpose text not null default 'setup'
  check (purpose in ('setup', 'reset'));
