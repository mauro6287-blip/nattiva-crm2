BEGIN;

-- 1. Habilitar seguridad a nivel de fila (por si no estaba)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. Crear política: "Los Admins pueden ver su propio Sindicato"
DROP POLICY IF EXISTS "Admins view own tenant" ON public.tenants;
CREATE POLICY "Admins view own tenant"
ON public.tenants
FOR SELECT
USING (
  id IN (
    SELECT tenant_id FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid()
  )
);

-- 3. Crear política: "Los Admins pueden EDITAR su propio Sindicato"
DROP POLICY IF EXISTS "Admins update own tenant" ON public.tenants;
CREATE POLICY "Admins update own tenant"
ON public.tenants
FOR UPDATE
USING (
  id IN (
    SELECT tenant_id FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'platform_owner')
  )
);

COMMIT;