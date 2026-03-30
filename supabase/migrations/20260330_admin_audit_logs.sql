create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  performed_at timestamptz not null default now(),
  actor_email text not null,
  target_user_email text not null,
  action_type text not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_admin_audit_logs_performed_at
  on admin_audit_logs (performed_at desc);

create index if not exists idx_admin_audit_logs_actor_email
  on admin_audit_logs (actor_email);

create index if not exists idx_admin_audit_logs_target_user_email
  on admin_audit_logs (target_user_email);

create index if not exists idx_admin_audit_logs_action_type
  on admin_audit_logs (action_type);
