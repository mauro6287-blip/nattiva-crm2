-- 1. Crear función auxiliar "Rompe-Bucles"
-- SECURITY DEFINER permite leer user_profiles sin activar sus propias políticas RLS recursivas.
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Limpiar políticas recursivas antiguas
DROP POLICY IF EXISTS "Gestión Proveedores V2" ON public.providers;
DROP POLICY IF EXISTS "Gestión Total Proveedores" ON public.providers;
DROP POLICY IF EXISTS "Admin ve sus proveedores" ON public.providers;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.providers;
DROP POLICY IF EXISTS "Providers_Isolation_Policy" ON public.providers;

-- 3. Aplicar Política Segura usando la función
CREATE POLICY "Providers_Isolation_Policy" ON public.providers
FOR ALL
USING (
    tenant_id = get_auth_tenant_id()
)
WITH CHECK (
    tenant_id = get_auth_tenant_id()
);
