BEGIN;

-- 1. Agregar la columna faltante
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active';

-- 2. Asegurar que las otras columnas requeridas por el Wizard existan
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_step int DEFAULT 1;

-- 3. Refrescar el caché de PostgREST
NOTIFY pgrst, 'reload config';

COMMIT;
