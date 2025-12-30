BEGIN;

-- 1. Verificar (y re-crear si falló antes) la columna real
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active';

-- 2. TRUCO DE REFRESCO: Crear una columna basura y borrarla inmediatamente.
-- Esto obliga a PostgREST a detectar un cambio de estructura y recargar.
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS _cache_buster int;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS _cache_buster;

-- 3. Notificación explícita (por si acaso)
NOTIFY pgrst, 'reload config';

COMMIT;
