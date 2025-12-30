-- 1. Habilitar RLS (por si acaso)
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas que puedan estar fallando silenciosamente
DROP POLICY IF EXISTS "Admin ve sus proveedores" ON public.providers;
DROP POLICY IF EXISTS "Tenant Isolation Providers" ON public.providers;
DROP POLICY IF EXISTS "Gestión Total Proveedores" ON public.providers;
-- Also dropping the "Tenant Admins can manage providers" from initial migration just to be sure
DROP POLICY IF EXISTS "Tenant Admins can manage providers" ON public.providers;


-- 3. Crear LA política maestra (Lectura y Escritura)
CREATE POLICY "Gestión Total Proveedores" ON public.providers
FOR ALL
USING (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
)
WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
);
