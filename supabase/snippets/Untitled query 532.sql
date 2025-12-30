BEGIN;

-------------------------------------------------------
-- 1. CREAR LA "LLAVE MAESTRA" (Función VIP)
-------------------------------------------------------
-- Esta función averigua tu ID de sindicato (tenant) con permisos de administrador.
-- Al usar SECURITY DEFINER, se salta las reglas que causan el bucle.
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id_v3()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER -- <--- Esto es la magia
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-------------------------------------------------------
-- 2. ELIMINAR LAS REGLAS ROTAS (Limpieza Total)
-------------------------------------------------------
-- Borramos cualquier política anterior que esté causando problemas.
DROP POLICY IF EXISTS "Gestión Proveedores V2" ON public.providers;
DROP POLICY IF EXISTS "Gestión Total Proveedores" ON public.providers;
DROP POLICY IF EXISTS "Admin ve sus proveedores" ON public.providers;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.providers;
DROP POLICY IF EXISTS "Providers_Isolation_Policy" ON public.providers;
DROP POLICY IF EXISTS "Providers_Safe_Policy" ON public.providers;

-------------------------------------------------------
-- 3. APLICAR LA REGLA NUEVA (Sin Bucle)
-------------------------------------------------------
-- Ahora usamos la función del paso 1.
CREATE POLICY "Politica_Proveedores_Final" ON public.providers
FOR ALL
USING (
    tenant_id = get_auth_tenant_id_v3()
)
WITH CHECK (
    tenant_id = get_auth_tenant_id_v3()
);

COMMIT;