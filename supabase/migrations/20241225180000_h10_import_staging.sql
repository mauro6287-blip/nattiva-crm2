-- Hito 10: Bulk Import Staging Table

-- 1. Create Staging Table
CREATE TABLE IF NOT EXISTS public.import_staging_socios (
    id uuid primary key default gen_random_uuid(),
    batch_id uuid not null,
    tenant_id uuid references public.tenants(id) on delete cascade not null,
    raw_data jsonb,
    status text default 'PENDING', -- PENDING, VALID, ERROR, DUPLICATE
    validation_message text,
    created_at timestamptz default now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_import_staging_batch ON public.import_staging_socios(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_staging_tenant ON public.import_staging_socios(tenant_id);

-- 3. RLS
ALTER TABLE public.import_staging_socios ENABLE ROW LEVEL SECURITY;

-- Admins Only
CREATE POLICY "Admins full access staging" ON public.import_staging_socios
FOR ALL
USING (
    tenant_id = public.get_my_tenant_id() 
    AND 
    public.get_my_role_code() IN ('admin', 'superadmin')
);

-- Service Role
CREATE POLICY "Service Role full access staging" ON public.import_staging_socios FOR ALL TO service_role USING (true) WITH CHECK (true);
