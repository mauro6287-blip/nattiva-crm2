create table if not exists payment_audit_logs (
  id uuid default gen_random_uuid() primary key,
  received_at timestamp with time zone default now(),
  email_subject text,
  email_body text,
  status text check (status in ('MATCHED', 'ORPHAN')) default 'ORPHAN',
  matched_order_code text
);

-- RLS: Admins only
alter table payment_audit_logs enable row level security;

create policy "Admins can view audit logs"
  on payment_audit_logs for select
  using (exists (
    select 1 from user_profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can insert audit logs"
  on payment_audit_logs for insert
  with check (exists (
    select 1 from user_profiles
    where id = auth.uid() and role = 'admin'
  ));
  
create policy "Admins can update audit logs"
  on payment_audit_logs for update
  using (exists (
    select 1 from user_profiles
    where id = auth.uid() and role = 'admin'
  ));
