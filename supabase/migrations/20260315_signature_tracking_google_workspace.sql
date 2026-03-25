alter table signature_requests add column if not exists provider_request_id text;
alter table signature_requests add column if not exists provider_template_id text;
alter table signature_requests add column if not exists provider_url text;
alter table signature_requests add column if not exists google_drive_file_id text;
alter table signature_requests add column if not exists google_drive_folder_id text;
alter table signature_requests add column if not exists provider_status text;
alter table signature_requests add column if not exists last_synced_at timestamptz;

create table if not exists signature_request_events (
  id uuid primary key default gen_random_uuid(),
  signature_request_id uuid not null references signature_requests(id) on delete cascade,
  event_type text not null,
  summary text not null,
  metadata jsonb not null default "{}"::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_signature_request_events_request on signature_request_events (signature_request_id, occurred_at desc);
