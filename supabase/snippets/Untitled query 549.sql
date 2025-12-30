-- COMPARAR IDENTIDADES
-- Vamos a ver el ID de tu usuario vs el ID de los campos configurados
SELECT 'Usuario Admin' as tipo, email as nombre, tenant_id 
FROM public.user_profiles 
WHERE email = 'admin@sindicato.cl'

UNION ALL

SELECT 'Campo Configurado' as tipo, label as nombre, tenant_id 
FROM public.organization_fields;