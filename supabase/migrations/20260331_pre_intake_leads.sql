create table if not exists public.pre_intake_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new',
  full_name text not null,
  email text not null,
  phone text not null,
  requested_amount text not null,
  asset_location text not null,
  property_type text not null,
  asset_description text not null default '',
  ownership_status text not null default '',
  purchase_date text not null default '',
  purchase_price text not null default '',
  capital_invested text not null default '',
  existing_liens text not null default '',
  title_held text not null default '',
  estimated_value text not null default '',
  value_basis text not null default '',
  preferred_timeline text not null default '',
  application_token uuid not null default gen_random_uuid(),
  application_link_generated_at timestamptz,
  application_started_at timestamptz,
  application_submitted_at timestamptz,
  application_id uuid references public.commercial_loan_applications(id) on delete set null,
  summary_email_queued_at timestamptz,
  constraint pre_intake_leads_status_check
    check (status in ('new', 'application_link_generated', 'application_started', 'application_submitted', 'closed')),
  constraint pre_intake_leads_application_token_key unique (application_token)
);

create index if not exists idx_pre_intake_leads_created_at
  on public.pre_intake_leads (created_at desc);

create index if not exists idx_pre_intake_leads_email
  on public.pre_intake_leads (lower(email));

create index if not exists idx_pre_intake_leads_status
  on public.pre_intake_leads (status);

alter table public.pre_intake_leads enable row level security;

create or replace function public.set_pre_intake_leads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pre_intake_leads_updated_at
  on public.pre_intake_leads;

create trigger trg_pre_intake_leads_updated_at
before update on public.pre_intake_leads
for each row
execute function public.set_pre_intake_leads_updated_at();

drop policy if exists "staff_select_pre_intake_leads" on public.pre_intake_leads;
drop policy if exists "staff_update_pre_intake_leads" on public.pre_intake_leads;

create policy "staff_select_pre_intake_leads"
on public.pre_intake_leads
for select
to authenticated
using (
  exists (
    select 1
    from public.turicum_user_profiles
    where turicum_user_profiles.user_id = auth.uid()
      and turicum_user_profiles.role in ('staff_admin', 'staff_ops', 'staff_counsel')
      and turicum_user_profiles.is_active = true
  )
);

create policy "staff_update_pre_intake_leads"
on public.pre_intake_leads
for update
to authenticated
using (
  exists (
    select 1
    from public.turicum_user_profiles
    where turicum_user_profiles.user_id = auth.uid()
      and turicum_user_profiles.role in ('staff_admin', 'staff_ops', 'staff_counsel')
      and turicum_user_profiles.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.turicum_user_profiles
    where turicum_user_profiles.user_id = auth.uid()
      and turicum_user_profiles.role in ('staff_admin', 'staff_ops', 'staff_counsel')
      and turicum_user_profiles.is_active = true
  )
);
