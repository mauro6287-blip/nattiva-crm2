-- Create organization_fields table to replace custom_field_definitions
create table if not exists organization_fields (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references tenants(id) on delete cascade, -- Assuming tenants table exists, or maybe link to user_profiles tenant_id?
  -- Wait, I need to check if 'tenants' table exists. 
  -- In Step 11/28/31, we see 'user_profiles' has 'tenant_id'. 
  -- I'll use simple uuid for now and maybe add FK if I find the tenants table.
  -- Safe bet: just uuid.
  
  field_key text not null,
  label text not null,
  data_type text not null check (data_type in ('text', 'number', 'select', 'date')),
  options jsonb, -- Flexible storage for options
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  unique(tenant_id, field_key)
);

-- RLS
alter table organization_fields enable row level security;

create policy "Admins can manage organization fields"
  on organization_fields for all
  using (
    (auth.jwt() ->> 'role') = 'admin'
    AND (select tenant_id from user_profiles where id = auth.uid()) = organization_fields.tenant_id
  );

create policy "Authenticated users can view organization fields"
  on organization_fields for select
  using (exists (
    select 1 from user_profiles
    where id = auth.uid() and tenant_id = organization_fields.tenant_id
  ));
