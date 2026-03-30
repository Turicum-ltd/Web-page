create table if not exists public.case_inquiries (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null,
  status text not null default 'pending',
  staff_notes text,
  created_at timestamptz not null default now(),
  constraint case_inquiries_status_check
    check (status in ('pending', 'contacted', 'closed'))
);

create index if not exists idx_case_inquiries_investor_id
  on public.case_inquiries (investor_id);

create index if not exists idx_case_inquiries_case_id
  on public.case_inquiries (case_id);

create index if not exists idx_case_inquiries_created_at
  on public.case_inquiries (created_at desc);

alter table public.case_inquiries enable row level security;

drop policy if exists "investor_select_own_case_inquiries" on public.case_inquiries;
drop policy if exists "investor_insert_own_case_inquiries" on public.case_inquiries;
drop policy if exists "staff_select_case_inquiries" on public.case_inquiries;
drop policy if exists "staff_update_case_inquiries" on public.case_inquiries;

create policy "investor_select_own_case_inquiries"
on public.case_inquiries
for select
to authenticated
using (auth.uid() = investor_id);

create policy "investor_insert_own_case_inquiries"
on public.case_inquiries
for insert
to authenticated
with check (auth.uid() = investor_id);

create policy "staff_select_case_inquiries"
on public.case_inquiries
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

create policy "staff_update_case_inquiries"
on public.case_inquiries
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
