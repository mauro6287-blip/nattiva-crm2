-- 1. HABILITAR EL PERMISO DE CREACIÓN (INSERT)
-- Esto permite que el Admin inserte nuevos socios en la tabla
CREATE POLICY "Permitir a usuarios autenticados crear socios"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. ASEGURAR QUE PUEDAS VERLOS DESPUÉS DE CREARLOS (SELECT)
-- (Por si acaso faltaba esta regla para ver a los demás)
CREATE POLICY "Ver todos los socios de mi organización"
ON public.user_profiles
FOR SELECT
USING (
    tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
);