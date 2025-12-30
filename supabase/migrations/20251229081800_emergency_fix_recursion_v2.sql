BEGIN;

-- 1. Crear función de seguridad "Rompe-Bucles"
-- Esta función obtiene el tenant_id con privilegios de sistema, evitando el chequeo RLS recursivo.
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id_v2()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. ELIMINAR TODAS las políticas sospechosas de la tabla providers
DROP POLICY IF EXISTS "Gestión Proveedores V2" ON public.providers;
DROP POLICY IF EXISTS "Gestión Total Proveedores" ON public.providers;
DROP POLICY IF EXISTS "Admin ve sus proveedores" ON public.providers;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.providers;
DROP POLICY IF EXISTS "Providers_Isolation_Policy" ON public.providers;
DROP POLICY IF EXISTS "Providers_Safe_Policy" ON public.providers;

-- 3. CREAR LA POLÍTICA SEGURA (Usando la función del paso 1)
CREATE POLICY "Providers_Safe_Policy" ON public.providers
FOR ALL
USING (
    tenant_id = get_auth_tenant_id_v2()
)
WITH CHECK (
    tenant_id = get_auth_tenant_id_v2()
);

COMMIT;
