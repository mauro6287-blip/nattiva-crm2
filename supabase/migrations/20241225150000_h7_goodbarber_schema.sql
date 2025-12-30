-- Hito 7: GoodBarber Extension & Column Security

-- 1. Add Columns
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS goodbarber_app_id text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS goodbarber_api_key text;

-- 2. Column-Level Security
-- We want to hide the new columns from 'authenticated' and 'anon'.
-- By default, if they have SELECT on the table, they see new columns unless we revoke.
-- But usually, grants are on the table.
-- We must revoke SELECT on the TABLE, then GRANT it back on specific columns.

-- Revoke existing broad grants (if any)
REVOKE SELECT ON public.tenants FROM authenticated;
REVOKE SELECT ON public.tenants FROM anon;

-- Grant back only public/safe columns
GRANT SELECT (id, name, slug, status, timezone, created_at, updated_at, deleted_at, deleted_by) 
ON public.tenants TO authenticated;

GRANT SELECT (id, name, slug, status, timezone, created_at, updated_at, deleted_at, deleted_by) 
ON public.tenants TO anon;

-- Service Role (and postgres/superuser) usually retain access, but let's ensure service_role has ALL
GRANT ALL ON public.tenants TO service_role;

-- 3. Data Patch
UPDATE public.tenants
SET 
  goodbarber_app_id = 'TEST_APP_ID_123',
  goodbarber_api_key = 'TEST_KEY_XYZ'
WHERE 
  slug = 'sindicato-demo' OR name ILIKE 'Sindicato Demo%';
