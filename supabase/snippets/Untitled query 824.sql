-- 1. VERIFICAR QUIÉN ESTÁ ESCONDIDO (Diagnóstico)
-- Esto te mostrará a TODOS, tengan o no tengan ID de organización.
SELECT email, full_name, tenant_id FROM public.user_profiles;

-- 2. EL RESCATE (Copiar ID de Juan Perez a Juan Test)
-- Tomamos el ID válido de "Juan Perez" y se lo forzamos a "Juan Test" (juan@test.com)
UPDATE public.user_profiles
SET tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE email = 'juan.perez@test.com' LIMIT 1)
WHERE email = 'juan@test.com';