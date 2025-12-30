-- 1. Create Definitions Table
create table if not exists custom_field_definitions (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  field_type text not null check (field_type in ('text', 'number', 'date', 'select')),
  is_required boolean default false,
  options text[], -- For select fields
  created_at timestamp with time zone default now()
);

-- RLS
alter table custom_field_definitions enable row level security;

create policy "Admins can manage custom fields"
  on custom_field_definitions for all
  using (exists (
    select 1 from user_profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "All authenticated can read custom fields"
  on custom_field_definitions for select
  using (auth.role() = 'authenticated');

-- 2. Update Socios Table (Using socios as decided in plan)
alter table socios add column if not exists custom_data jsonb default '{}'::jsonb;
