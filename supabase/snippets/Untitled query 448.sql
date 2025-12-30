-- SOLO ROMPER EL VÍNCULO (Lo único que impide la importación)
-- Esto permite crear socios sin que tengan login todavía.
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;