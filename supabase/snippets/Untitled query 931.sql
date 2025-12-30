BEGIN;

-- 1. Forzar la vinculación: Unir al usuario 'venta2' con el sindicato 'demo-ventas'
UPDATE public.user_profiles
SET 
    role = 'admin',
    tenant_id = (SELECT id FROM public.tenants WHERE slug = 'demo-ventas' LIMIT 1)
WHERE email = 'venta2@sindicato.cl';

-- 2. Verificación: ¿Quedó unido? (Debería mostrarte el ID del tenant en la columna tenant_id)
SELECT email, role, tenant_id 
FROM public.user_profiles 
WHERE email = 'venta2@sindicato.cl';

COMMIT;