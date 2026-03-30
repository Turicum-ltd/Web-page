alter table public.admin_audit_logs
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists description text;

create index if not exists idx_admin_audit_logs_user_id
  on public.admin_audit_logs (user_id);

create or replace function public.log_case_inquiry_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  investor_email text;
begin
  select users.email
  into investor_email
  from auth.users as users
  where users.id = new.investor_id;

  insert into public.admin_audit_logs (
    user_id,
    actor_email,
    target_user_email,
    action_type,
    description,
    metadata
  )
  values (
    new.investor_id,
    coalesce(lower(investor_email), ''),
    coalesce(lower(investor_email), ''),
    'INVESTOR_INQUIRY',
    'Investor requested full package for Case ' || new.case_id,
    jsonb_build_object(
      'case_id', new.case_id,
      'inquiry_id', new.id,
      'status', new.status
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_case_inquiries_audit_log
  on public.case_inquiries;

create trigger trg_case_inquiries_audit_log
after insert on public.case_inquiries
for each row
execute function public.log_case_inquiry_audit_event();
