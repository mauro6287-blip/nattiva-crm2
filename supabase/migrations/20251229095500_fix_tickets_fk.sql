BEGIN;

-- 1. Asegurar que la columna tenga el tipo correcto
ALTER TABLE public.tickets 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 2. Eliminar cualquier restricción antigua mal formada
ALTER TABLE public.tickets 
DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;

-- 3. CREAR EL PUENTE (Foreign Key)
-- Esto le dice a Supabase: "El user_id del ticket APUNTA al id del perfil de usuario"
ALTER TABLE public.tickets
ADD CONSTRAINT tickets_user_id_fkey
FOREIGN KEY (user_id) 
REFERENCES public.user_profiles(id)
ON DELETE SET NULL;

-- 4. Refrescar Schema Cache (Forzar a Supabase a ver el cambio)
NOTIFY pgrst, 'reload config';

COMMIT;
