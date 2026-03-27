create type turicum_user_role as enum (
  'staff_admin',
  'staff_ops',
  'staff_counsel',
  'investor',
  'borrower'
);

create type turicum_case_access_role as enum (
  'viewer',
  'editor',
  'lead',
  'investor',
  'borrower'
);

create table if not exists turicum_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role turicum_user_role not null,
  full_name text,
  organization text,
  is_active boolean not null default true,
  invited_by uuid references auth.users(id) on delete set null,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists turicum_case_access_grants (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_role turicum_case_access_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (case_id, user_id, access_role)
);

create table if not exists turicum_borrower_portal_invites (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  email text,
  invite_token_hash text not null,
  expires_at timestamptz not null,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_turicum_user_profiles_role
  on turicum_user_profiles (role)
  where is_active = true;

create index if not exists idx_turicum_case_access_grants_case
  on turicum_case_access_grants (case_id);

create index if not exists idx_turicum_case_access_grants_user
  on turicum_case_access_grants (user_id);

create index if not exists idx_turicum_borrower_portal_invites_case
  on turicum_borrower_portal_invites (case_id);

create index if not exists idx_turicum_borrower_portal_invites_email
  on turicum_borrower_portal_invites (lower(email))
  where email is not null;

create or replace function public.current_turicum_role()
returns turicum_user_role
language sql
stable
as $$
  select profile.role
  from public.turicum_user_profiles as profile
  where profile.user_id = auth.uid()
    and profile.is_active = true
$$;

create or replace function public.current_turicum_case_access(target_case_id uuid)
returns setof turicum_case_access_role
language sql
stable
as $$
  select grant_row.access_role
  from public.turicum_case_access_grants as grant_row
  where grant_row.case_id = target_case_id
    and grant_row.user_id = auth.uid()
    and (grant_row.expires_at is null or grant_row.expires_at > now())
$$;

comment on table turicum_user_profiles is
  'Application-level identity metadata layered on top of Supabase auth.users for Turicum staff, investors, and borrowers.';

comment on table turicum_case_access_grants is
  'Per-case authorization grants for staff, investors, and borrower accounts once Turicum moves off shared environment passwords.';

comment on table turicum_borrower_portal_invites is
  'Foundation table for expiring borrower access links and future borrower-account claims.';
