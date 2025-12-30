-- SEGURIDAD: Sincronizar columna RUT en la Nube
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS rut text;
CREATE INDEX IF NOT EXISTS idx_user_profiles_rut ON public.user_profiles(rut);