-- 1. Asegurar que la seguridad esté activa
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar reglas viejas o mal configuradas
DROP POLICY IF EXISTS "Admins can view tenant tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view tickets" ON public.tickets;

-- 3. CREAR LA REGLA MAESTRA
-- "Permitir ver tickets si pertenecen a mi mismo Sindicato (Tenant)"
CREATE POLICY "Admins can view tenant tickets"
ON public.tickets
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.user_profiles
    WHERE user_id = auth.uid()
  )
);

-- 4. (Opcional) Permitir a los admins editar/responder tickets
CREATE POLICY "Admins can update tenant tickets"
ON public.tickets
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.user_profiles
    WHERE user_id = auth.uid()
  )
);