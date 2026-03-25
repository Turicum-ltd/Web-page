create table if not exists borrower_portals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  access_token text not null unique,
  portal_title text not null,
  borrower_name text,
  borrower_email text,
  portal_status text not null default 'draft' check (
    portal_status in ('draft', 'ready_to_share', 'in_progress', 'submitted', 'closed')
  ),
  assigned_forms jsonb not null default '[]'::jsonb,
  submitted_forms jsonb not null default '[]'::jsonb,
  form_responses jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id)
);

create table if not exists signature_requests (
  id uuid primary key default gen_random_uuid(),
  borrower_portal_id uuid not null references borrower_portals(id) on delete cascade,
  form_code text not null,
  title text not null,
  provider text not null check (provider in ('google_workspace', 'documenso', 'manual_upload')),
  status text not null default 'prepared' check (
    status in ('draft', 'prepared', 'sent', 'signed', 'declined')
  ),
  recipient_name text,
  recipient_email text,
  note text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  signed_at timestamptz
);

create index if not exists idx_borrower_portals_case on borrower_portals (case_id);
create index if not exists idx_signature_requests_portal on signature_requests (borrower_portal_id);
