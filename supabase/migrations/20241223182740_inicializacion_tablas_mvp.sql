-- 0. EXTENSIONS & SETUP
create extension if not exists "pgcrypto";
create extension if not exists "citext";

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. ENUMS
create type public.socio_status as enum ('pending', 'verified', 'unmatched', 'ex_member', 'blocked');
create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type public.content_status as enum ('borrador', 'enviado', 'aprobado', 'rechazado', 'publicado', 'archivado');
create type public.approval_decision as enum ('approved', 'rejected');
create type public.validation_method as enum ('qr', 'member_id', 'email', 'manual');

-- 2. TABLES

-- 1. TENANTS
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status text not null default 'active',
  timezone text default 'America/Santiago',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid,
  constraint tenants_slug_key unique (slug)
);
alter table public.tenants enable row level security;

-- 2. TENANT_INTEGRATIONS
create table public.tenant_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  provider text not null,
  app_id text,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid,
  unique (tenant_id, provider)
);
alter table public.tenant_integrations enable row level security;

-- 3. ROLES
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  code text not null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid
);
alter table public.roles enable row level security;

-- 4. PERMISSIONS
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text
);
alter table public.permissions enable row level security;

-- 5. ROLE_PERMISSIONS
create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  role_id uuid references public.roles(id) on delete cascade not null,
  permission_id uuid references public.permissions(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.role_permissions enable row level security;

-- 6. USER_PROFILES
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  email citext,
  role_id uuid references public.roles(id) on delete set null,
  full_name text,
  is_active boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid
);
alter table public.user_profiles enable row level security;

-- 7. SOCIOS
create table public.socios (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  names text not null,
  surnames text not null,
  rut_or_document text,
  email citext,
  status public.socio_status default 'pending',
  source text default 'manual',
  join_date date,
  verified_at timestamptz,
  ex_member_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid
);
alter table public.socios enable row level security;

-- 8. PADRON_IMPORTS
create table public.padron_imports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  source_type text,
  status text default 'processing',
  total_rows integer default 0,
  matched_rows integer default 0,
  unmatched_rows integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid
);
alter table public.padron_imports enable row level security;

-- 9. PADRON_ROWS
create table public.padron_rows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  import_id uuid references public.padron_imports(id) on delete cascade not null,
  row_number integer,
  raw jsonb,
  match_status text,
  matched_socio_id uuid references public.socios(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.padron_rows enable row level security;

-- 10. SOCIO_USER_LINKS
create table public.socio_user_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  socio_id uuid references public.socios(id) on delete cascade not null,
  link_status text default 'active',
  linked_at timestamptz default now(),
  revoked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid,
  unique(tenant_id, user_id)
);
alter table public.socio_user_links enable row level security;

-- 11. GOODBARBER_USER_MAP
create table public.goodbarber_user_map (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  gb_user_id text not null,
  gb_email citext,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.goodbarber_user_map enable row level security;

-- 12. GOODBARBER_GROUP_SYNC_LOG
create table public.goodbarber_group_sync_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  action text,
  status text,
  attempts integer default 0,
  last_error text,
  requested_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.goodbarber_group_sync_log enable row level security;

-- 13. PROVEEDORES
create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  tax_id text,
  contact_email citext,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid
);
alter table public.proveedores enable row level security;

-- 14. CONVENIOS
create table public.convenios (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  proveedor_id uuid references public.proveedores(id) on delete cascade,
  title text not null,
  is_active boolean default true,
  validation_rules jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid
);
alter table public.convenios enable row level security;

-- 15. VALIDATION_EVENTS
create table public.validation_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  convenio_id uuid references public.convenios(id) on delete cascade not null,
  socio_id uuid references public.socios(id) on delete set null,
  method public.validation_method not null,
  result text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.validation_events enable row level security;

-- 16. TICKETS
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  created_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  subject text not null,
  status public.ticket_status default 'open',
  priority text default 'normal',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid
);
alter table public.tickets enable row level security;

-- 17. TICKET_MESSAGES
create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete set null,
  body text,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid
);
alter table public.ticket_messages enable row level security;

-- 18. CONTENT_ITEMS
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  provider_id uuid references auth.users(id) on delete set null,
  title text not null,
  summary text,
  content_html text,
  thumbnail_url text default 'https://placehold.co/600x400.png?text=No+Image',
  category text,
  author_name text,
  status public.content_status default 'borrador',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid
);
alter table public.content_items enable row level security;

-- 19. CONTENT_REVIEWS
create table public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid references public.content_items(id) on delete cascade not null,
  reviewer_id uuid references auth.users(id) on delete set null,
  new_status public.content_status,
  comment text,
  created_at timestamptz default now()
);
alter table public.content_reviews enable row level security;

-- 20. CAMPAIGNS
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  status text default 'draft',
  audience jsonb default '{}'::jsonb,
  channels text[] default array[]::text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid
);
alter table public.campaigns enable row level security;

-- 21. CAMPAIGN_EVENTS
create table public.campaign_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.campaign_events enable row level security;

-- 22. AUDIT_LOG
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  "before" jsonb,
  "after" jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.audit_log enable row level security;

-- 3. TRIGGERS
create trigger set_timestamp_tenants before update on public.tenants for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_tenant_integrations before update on public.tenant_integrations for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_roles before update on public.roles for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_role_permissions before update on public.role_permissions for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_user_profiles before update on public.user_profiles for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_socios before update on public.socios for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_padron_imports before update on public.padron_imports for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_padron_rows before update on public.padron_rows for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_socio_user_links before update on public.socio_user_links for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_goodbarber_user_map before update on public.goodbarber_user_map for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_goodbarber_group_sync_log before update on public.goodbarber_group_sync_log for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_proveedores before update on public.proveedores for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_convenios before update on public.convenios for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_validation_events before update on public.validation_events for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_tickets before update on public.tickets for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_ticket_messages before update on public.ticket_messages for each row execute procedure public.handle_updated_at();
create trigger set_timestamp_content_items before update on public.content_items for each row execute procedure public.handle_updated_at();

-- 4. POLICIES
create policy "Allow all" on public.tenants for all using (true) with check (true);
create policy "Allow all" on public.tenant_integrations for all using (true) with check (true);
create policy "Allow all" on public.roles for all using (true) with check (true);
create policy "Allow all" on public.permissions for all using (true) with check (true);
create policy "Allow all" on public.role_permissions for all using (true) with check (true);
create policy "Allow all" on public.user_profiles for all using (true) with check (true);
create policy "Allow all" on public.socios for all using (true) with check (true);
create policy "Allow all" on public.padron_imports for all using (true) with check (true);
create policy "Allow all" on public.padron_rows for all using (true) with check (true);
create policy "Allow all" on public.socio_user_links for all using (true) with check (true);
create policy "Allow all" on public.goodbarber_user_map for all using (true) with check (true);
create policy "Allow all" on public.goodbarber_group_sync_log for all using (true) with check (true);
create policy "Allow all" on public.proveedores for all using (true) with check (true);
create policy "Allow all" on public.convenios for all using (true) with check (true);
create policy "Allow all" on public.validation_events for all using (true) with check (true);
create policy "Allow all" on public.tickets for all using (true) with check (true);
create policy "Allow all" on public.ticket_messages for all using (true) with check (true);
create policy "Allow all" on public.content_items for all using (true) with check (true);
create policy "Allow all" on public.content_reviews for all using (true) with check (true);
create policy "Allow all" on public.campaigns for all using (true) with check (true);
create policy "Allow all" on public.campaign_events for all using (true) with check (true);
create policy "Allow all" on public.audit_log for all using (true) with check (true);
