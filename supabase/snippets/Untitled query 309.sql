-- ROMPER EL BUCLE DE SEGURIDAD
-- 1. Borramos la regla antigua que causaba la ceguera
DROP POLICY IF EXISTS "Ver mi propio perfil" ON public.user_profiles;

-- 2. Creamos la regla nueva y simple: "Siempre puedo ver mis propios datos"
CREATE POLICY "Ver mi propio perfil"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- 3. Refrescamos la memoria de Supabase
NOTIFY pgrst, 'reload config';