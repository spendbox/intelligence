-- Folio: compliance + manual matching control
alter table businesses
  add column if not exists compliance_kind text check (compliance_kind in ('business','individual')),
  add column if not exists legal_name text,
  add column if not exists registration_number text, -- CAC RC or BN number
  add column if not exists nin text,
  add column if not exists id_document_url text,
  add column if not exists registration_document_url text,
  add column if not exists compliance_status text not null default 'unsubmitted'
    check (compliance_status in ('unsubmitted','pending','approved','rejected')),
  add column if not exists compliance_submitted_at timestamptz,
  add column if not exists compliance_reviewed_at timestamptz,
  add column if not exists compliance_reviewer text,
  add column if not exists compliance_notes text;

-- Manual control over which businesses are emailed about a lead.
alter table lead_notifications
  add column if not exists email_sent boolean not null default false,
  add column if not exists added_by text;

-- Backfill: existing rows were inserted at the same moment we sent the email.
update lead_notifications set email_sent = true where email_sent = false and sent_at is not null;
