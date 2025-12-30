DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. BUCLE DE LIMPIEZA TOTAL
    -- Busca CUALQUIER política activa en la tabla 'providers' y la borra.
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'providers' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.providers';
    END LOOP;
END $$;

-- 2. ASEGURAR QUE LA FUNCIÓN VIP EXISTA
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id_v3()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 3. APLICAR LA ÚNICA POLÍTICA NUEVA
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Politica_Unica_Proveedores" ON public.providers
FOR ALL
USING (
    tenant_id = get_auth_tenant_id_v3()
)
WITH CHECK (
    tenant_id = get_auth_tenant_id_v3()
);