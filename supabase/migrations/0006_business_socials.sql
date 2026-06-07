-- Folio: socials + slug refresh + indexes
alter table businesses
  add column if not exists logo_url text,
  add column if not exists website text,
  add column if not exists instagram text,
  add column if not exists twitter text,
  add column if not exists facebook text,
  add column if not exists linkedin text,
  add column if not exists tiktok text,
  add column if not exists whatsapp text;
