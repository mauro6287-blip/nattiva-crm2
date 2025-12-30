-- REPORTE DE SALUD DEL SISTEMA --

-- 1. ¿Hay socios huérfanos? (Sin Tenant ID)
-- Si sale algo aquí, es GRAVE (Fallo de seguridad/asignación).
SELECT count(*) as "Socios Huérfanos (GRAVE)" 
FROM public.user_profiles 
WHERE tenant_id IS NULL;

-- 2. ¿Hay cargas familiares huérfanas? (Sin Padre asignado)
-- Si sale algo, tenemos basura en la base de datos.
SELECT count(*) as "Cargas Sin Padre" 
FROM public.family_members 
WHERE user_id IS NULL;

-- 3. ¿Tenemos datos sucios en los RUTs? (Formatos mezclados)
-- Esto nos dice si el importador necesita ser más estricto.
SELECT 
    (SELECT count(*) FROM public.user_profiles WHERE rut_or_document LIKE '%.%') as "RUTs con Puntos",
    (SELECT count(*) FROM public.user_profiles WHERE rut_or_document NOT LIKE '%.%') as "RUTs Limpios";

-- 4. Verificación de Seguridad RLS
-- Debería decir "true". Si dice "false", estamos expuestos.
SELECT rowsecurity as "RLS Activado en Socios"
FROM pg_tables
WHERE tablename = 'user_profiles';