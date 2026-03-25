create extension if not exists pgcrypto;

create table if not exists document_types (
  code text primary key,
  label text not null,
  default_category text not null,
  created_at timestamptz not null default now()
);

create table if not exists state_packs (
  id uuid primary key default gen_random_uuid(),
  state_code text not null,
  version text not null,
  enabled boolean not null default true,
  support_level text not null check (support_level in ('production', 'provisional', 'draft')),
  notes text,
  created_at timestamptz not null default now(),
  unique (state_code, version)
);

create table if not exists state_pack_structures (
  id uuid primary key default gen_random_uuid(),
  state_pack_id uuid not null references state_packs(id) on delete cascade,
  structure_type text not null check (structure_type in ('loan', 'purchase')),
  created_at timestamptz not null default now(),
  unique (state_pack_id, structure_type)
);

create table if not exists state_pack_documents (
  id uuid primary key default gen_random_uuid(),
  state_pack_id uuid not null references state_packs(id) on delete cascade,
  structure_type text not null check (structure_type in ('loan', 'purchase')),
  document_type_code text not null references document_types(code),
  category text not null,
  stage text not null,
  requirement_level text not null check (requirement_level in ('required', 'optional', 'placeholder')),
  notes text,
  created_at timestamptz not null default now(),
  unique (state_pack_id, structure_type, document_type_code)
);

create table if not exists state_pack_checklist_items (
  id uuid primary key default gen_random_uuid(),
  state_pack_id uuid not null references state_packs(id) on delete cascade,
  code text not null,
  label text not null,
  stage text not null,
  required_for text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (state_pack_id, code)
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  contact_type text not null default 'person',
  name text not null,
  email text,
  phone text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  street text,
  city text,
  state text,
  postal_code text,
  county text,
  property_type text,
  units integer,
  square_feet numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  case_code text not null unique,
  title text not null,
  state text not null,
  structure_type text not null check (structure_type in ('loan', 'purchase')),
  source_type text not null,
  stage text not null,
  status text not null,
  property_id uuid references properties(id) on delete set null,
  state_pack_id uuid references state_packs(id) on delete set null,
  headline_value numeric,
  requested_amount numeric,
  estimated_value numeric,
  existing_debt numeric,
  summary text,
  opened_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists case_contacts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  role_on_case text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (case_id, contact_id, role_on_case)
);

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  state text,
  structure_type text check (structure_type in ('loan', 'purchase')),
  document_type_code text not null references document_types(code),
  template_kind text not null check (template_kind in ('template', 'precedent', 'supporting_example')),
  storage_path text not null,
  version text not null default 'v1',
  is_active boolean not null default true,
  review_status text not null default 'unreviewed' check (
    review_status in ('unreviewed', 'ops_approved', 'counsel_reviewed', 'production_ready')
  ),
  source_case_code text,
  is_executed boolean not null default false,
  is_recorded boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  document_type_code text not null references document_types(code),
  template_id uuid references templates(id) on delete set null,
  category text not null,
  status text not null,
  title text,
  file_name text,
  mime_type text,
  storage_path text not null,
  recorded_at timestamptz,
  uploaded_at timestamptz not null default now(),
  notes text
);

create table if not exists case_checklist_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  state_pack_checklist_item_id uuid references state_pack_checklist_items(id) on delete set null,
  status text not null default 'not_started' check (
    status in ('not_started', 'requested', 'received', 'reviewed', 'waived', 'rejected')
  ),
  requested_at timestamptz,
  received_at timestamptz,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists term_sheets (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  status text not null default 'draft',
  sent_at timestamptz,
  signed_at timestamptz,
  expiration_date date,
  exclusivity_days integer,
  deposit_required numeric,
  storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists payment_schedules (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  label text not null,
  due_date date not null,
  expected_amount numeric not null,
  status text not null default 'due',
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  payment_schedule_id uuid references payment_schedules(id) on delete set null,
  received_date date not null,
  received_amount numeric not null,
  payment_method text not null default 'bank_transfer',
  bank_reference text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists atlas_case_workflow_state (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  workflow_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, workflow_type)
);

create index if not exists idx_cases_state_structure on cases (state, structure_type);
create index if not exists idx_cases_stage on cases (stage);
create index if not exists idx_case_documents_case on case_documents (case_id);
create index if not exists idx_templates_lookup on templates (state, structure_type, document_type_code);
create index if not exists idx_state_pack_documents_lookup on state_pack_documents (state_pack_id, structure_type);
create index if not exists idx_atlas_case_workflow_state_case on atlas_case_workflow_state (case_id);
create index if not exists idx_atlas_case_workflow_state_type on atlas_case_workflow_state (workflow_type);
