-- 1. QUITAR EL CANDADO ESTRICTO (Foreign Key)
-- Esto permite que existan socios importados que aún no tienen usuario en la App.
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- 2. ASEGURAR QUE EL ID SEA DE TIPO TEXTO (Para compatibilidad futura con GoodBarber)
-- Por si acaso estaba restringido a solo formato UUID estricto
ALTER TABLE public.user_profiles 
ALTER COLUMN id TYPE text;