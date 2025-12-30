-- 1. ASIGNAR CASA AL ADMIN
-- Si el admin no tiene ID de organización, le generamos uno nuevo y único.
UPDATE public.user_profiles
SET tenant_id = gen_random_uuid()
WHERE email = 'admin@sindicato.cl' AND tenant_id IS NULL;

-- 2. MUDANZA MASIVA
-- Ahora tomamos el ID del Admin y se lo asignamos a TODOS los usuarios que no tengan uno (Juan Test, Juan Pérez, etc.)
UPDATE public.user_profiles
SET tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE email = 'admin@sindicato.cl' LIMIT 1)
WHERE tenant_id IS NULL;

-- 3. VERIFICACIÓN
-- Muéstrame cómo quedaron todos ahora. Todos deberían tener el mismo código largo en "tenant_id".
SELECT email, full_name, tenant_id FROM public.user_profiles;