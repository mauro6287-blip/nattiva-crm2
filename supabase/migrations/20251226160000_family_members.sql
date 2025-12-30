-- Create family_members table
create table if not exists family_members (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references user_profiles(id) on delete cascade not null,
    tenant_id uuid not null, -- Can reference tenants(id) if exists, or just store uuid
    relationship text not null check (relationship in ('Spouse', 'Child', 'Parent', 'Other')),
    full_name text not null,
    rut text,
    birth_date date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table family_members enable row level security;

-- Policies
-- Admins can do everything
create policy "Admins can manage family members"
    on family_members
    for all
    using (
        (auth.jwt() ->> 'role') = 'admin'
        AND (select tenant_id from user_profiles where id = auth.uid()) = family_members.tenant_id
    );

-- Regular users (if we had them accessing this) might need read access
-- For now, restricting to Admins as per context (CRM for admins) or tenant access generally.
-- Safer to stick to strict tenant isolation.

create policy "Users can view family members of their tenant"
    on family_members
    for select
    using (
        exists (
            select 1 from user_profiles
            where id = auth.uid()
            and tenant_id = family_members.tenant_id
        )
    );
