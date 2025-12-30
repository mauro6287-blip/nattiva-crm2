-- 1. Crear la columna que falta en la tabla de Usuarios
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS goodbarber_app_id text;

-- 2. (Opcional) Crear un índice para que las búsquedas sean rápidas
CREATE INDEX IF NOT EXISTS idx_user_profiles_gb_id 
ON public.user_profiles(goodbarber_app_id);