alter table admin_audit_logs enable row level security;

drop policy if exists "staff_admin_select_admin_audit_logs" on admin_audit_logs;

create policy "staff_admin_select_admin_audit_logs"
on admin_audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from turicum_user_profiles
    where turicum_user_profiles.user_id = auth.uid()
      and turicum_user_profiles.role = 'staff_admin'
      and turicum_user_profiles.is_active = true
  )
);
