-- 1. LIMPIAR REGLAS ANTIGUAS (Para evitar conflictos)
DROP POLICY IF EXISTS "Ver todos los socios de mi organización" ON public.user_profiles;
DROP POLICY IF EXISTS "Ver mi propio perfil" ON public.user_profiles;

-- 2. REGLA DE ORO: VER MI PROPIO PERFIL (Rompe el bucle infinito)
-- Esto permite que el Admin lea su propio ID de Sindicato sin trabas.
CREATE POLICY "Ver mi propio perfil"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- 3. REGLA DE EQUIPO: VER A MI SINDICATO
-- Ahora sí podemos preguntar "¿Quiénes son de mi equipo?" porque ya puedo leerme a mí mismo.
CREATE POLICY "Ver compañeros de organizacion"
ON public.user_profiles
FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()
    )
);