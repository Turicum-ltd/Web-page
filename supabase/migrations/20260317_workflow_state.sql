create table if not exists atlas_case_workflow_state (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  workflow_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, workflow_type)
);

create index if not exists idx_atlas_case_workflow_state_case on atlas_case_workflow_state (case_id);
create index if not exists idx_atlas_case_workflow_state_type on atlas_case_workflow_state (workflow_type);
