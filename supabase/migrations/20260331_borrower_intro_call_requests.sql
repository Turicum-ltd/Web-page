create table if not exists public.borrower_intro_call_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new',
  full_name text not null,
  email text not null,
  phone text,
  requested_amount text,
  asset_location text,
  property_type text,
  preferred_date text,
  preferred_time_window text,
  preferred_timeline text,
  notes text not null default ''
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'borrower_intro_call_requests_status_check'
      and conrelid = 'public.borrower_intro_call_requests'::regclass
  ) then
    alter table public.borrower_intro_call_requests
      add constraint borrower_intro_call_requests_status_check
      check (status in ('new', 'reviewed', 'scheduled'));
  end if;
end $$;

create index if not exists idx_borrower_intro_call_requests_created_at
  on public.borrower_intro_call_requests (created_at desc);

create index if not exists idx_borrower_intro_call_requests_email
  on public.borrower_intro_call_requests (lower(email));

alter table public.borrower_intro_call_requests enable row level security;

drop policy if exists "staff_select_borrower_intro_call_requests" on public.borrower_intro_call_requests;

create policy "staff_select_borrower_intro_call_requests"
on public.borrower_intro_call_requests
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
