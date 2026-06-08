-- Folio: Discover economics shift — scanning is free, revealing each lead costs credits.
-- Adds per-lead reveal tracking and a 'reveal' wallet-transaction reason.

alter table discovered_leads
  add column if not exists revealed_at timestamptz,
  add column if not exists reveal_credits int;

alter table wallet_transactions drop constraint if exists wallet_transactions_reason_check;
alter table wallet_transactions add constraint wallet_transactions_reason_check
  check (reason in ('topup','unlock','refund','adjust','scan','reveal'));
