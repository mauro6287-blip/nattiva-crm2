-- Emergency Security Patch for Providers Table
-- 1. Reset Policies (Drop all known variants)
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestión Total Proveedores" ON public.providers;
DROP POLICY IF EXISTS "Admin ve sus proveedores" ON public.providers;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.providers;
DROP POLICY IF EXISTS "Tenant Isolation Providers" ON public.providers;
DROP POLICY IF EXISTS "Tenant Admins can manage providers" ON public.providers;

-- 2. Apply Master Policy (V2)
CREATE POLICY "Gestión Proveedores V2" ON public.providers
FOR ALL
USING (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
)
WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
);
