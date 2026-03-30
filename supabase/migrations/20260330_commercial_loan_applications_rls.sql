alter table public.commercial_loan_applications
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists profile_data jsonb not null default '{}'::jsonb,
  add column if not exists financial_data jsonb not null default '{}'::jsonb,
  add column if not exists property_data jsonb not null default '{}'::jsonb,
  add column if not exists declarations_data jsonb not null default '{}'::jsonb;

alter table public.commercial_loan_applications
  alter column status set default 'draft';

update public.commercial_loan_applications
set
  profile_data = jsonb_strip_nulls(
    coalesce(profile_data, '{}'::jsonb) ||
    coalesce(profile, '{}'::jsonb) ||
    jsonb_build_object(
      'primary_borrower_name', primary_borrower_name,
      'primary_borrower_email', primary_borrower_email,
      'primary_borrower_phone', primary_borrower_phone,
      'co_borrower_name', co_borrower_name,
      'co_borrower_email', co_borrower_email
    )
  ),
  financial_data = jsonb_strip_nulls(
    coalesce(financial_data, '{}'::jsonb) ||
    coalesce(financials, '{}'::jsonb) ||
    jsonb_build_object(
      'annual_income', annual_income
    )
  ),
  property_data = jsonb_strip_nulls(
    coalesce(property_data, '{}'::jsonb) ||
    coalesce(subject_property, '{}'::jsonb) ||
    jsonb_build_object(
      'requested_amount', requested_amount,
      'property_address', property_address,
      'property_type', property_type,
      'borrowing_entity_name', borrowing_entity_name
    )
  ),
  declarations_data = jsonb_strip_nulls(
    coalesce(declarations_data, '{}'::jsonb) ||
    coalesce(declarations, '{}'::jsonb)
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'commercial_loan_applications_status_check'
      and conrelid = 'public.commercial_loan_applications'::regclass
  ) then
    alter table public.commercial_loan_applications
      add constraint commercial_loan_applications_status_check
      check (status in ('draft', 'submitted', 'under_review', 'approved'));
  end if;
end $$;

create index if not exists idx_commercial_loan_applications_user_id
  on public.commercial_loan_applications (user_id);

create or replace function public.set_commercial_loan_applications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_commercial_loan_applications_updated_at
  on public.commercial_loan_applications;

create trigger trg_commercial_loan_applications_updated_at
before update on public.commercial_loan_applications
for each row
execute function public.set_commercial_loan_applications_updated_at();

alter table public.commercial_loan_applications enable row level security;

drop policy if exists "owner_select_commercial_loan_applications" on public.commercial_loan_applications;
drop policy if exists "owner_insert_commercial_loan_applications" on public.commercial_loan_applications;
drop policy if exists "owner_update_commercial_loan_applications" on public.commercial_loan_applications;
drop policy if exists "staff_select_commercial_loan_applications" on public.commercial_loan_applications;

create policy "owner_select_commercial_loan_applications"
on public.commercial_loan_applications
for select
to authenticated
using (auth.uid() = user_id);

create policy "owner_insert_commercial_loan_applications"
on public.commercial_loan_applications
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "owner_update_commercial_loan_applications"
on public.commercial_loan_applications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "staff_select_commercial_loan_applications"
on public.commercial_loan_applications
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
