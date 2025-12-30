-- REPORTE DE SALUD (VERSIÓN SEGURA) --

-- 1. ¿Hay socios huérfanos? (Sin Tenant ID)
SELECT count(*) as "Socios Huérfanos (GRAVE)" 
FROM public.user_profiles 
WHERE tenant_id IS NULL;

-- 2. ¿Hay cargas familiares huérfanas? (Sin Padre asignado)
SELECT count(*) as "Cargas Sin Padre" 
FROM public.family_members 
WHERE user_id IS NULL;

-- 3. Verificación de Seguridad RLS
SELECT rowsecurity as "RLS Activado en Socios"
FROM pg_tables
WHERE tablename = 'user_profiles';