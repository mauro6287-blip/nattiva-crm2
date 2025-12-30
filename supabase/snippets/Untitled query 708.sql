BEGIN;

-- 1. LIMPIEZA: Eliminar el "Zombie" (el sindicato fallido)
-- Cambia 'demo-ventas' si usaste otro slug, pero según tus datos era este.
DELETE FROM public.tenants WHERE slug = 'demo-ventas';

-- 2. LIMPIEZA ADICIONAL: Eliminar perfil de usuario si quedó huérfano
DELETE FROM public.user_profiles WHERE email = 'venta1@sindicato.cl';

-- 3. CORRECCIÓN ESTRUCTURAL (El error anterior)
-- Agregamos la columna 'role' para que no falle el siguiente paso.
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 4. Asegurarnos que tu usuario actual sea SuperAdmin (para no perder acceso)
UPDATE public.user_profiles 
SET role = 'superadmin' 
WHERE id = auth.uid();

-- 5. Refrescar el sistema
NOTIFY pgrst, 'reload config';

COMMIT;