-- 1. RESCATAR PERDIDOS (Asignar tu Tenant ID a los importados)
-- Busca cuál es tu organización (basado en tu email admin) y se la pega a los que no tienen nada (Juan Test).
UPDATE public.user_profiles
SET tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE email = 'admin@sindicato.cl' LIMIT 1)
WHERE tenant_id IS NULL;

-- 2. DARLE TALLA A JUAN PÉREZ (Para que puedas probar la visualización)
-- Como Juan Pérez es antiguo, le inyectamos el dato a la fuerza.
UPDATE public.user_profiles
SET custom_data = '{"Talla": "L"}'::jsonb
WHERE email = 'juan.perez@test.com';

-- 3. REPORTE DE BÚSQUEDA
SELECT full_name, email, tenant_id, custom_data 
FROM public.user_profiles 
WHERE email IN ('juan@test.com', 'juan.perez@test.com');