-- RADIOGRAFÍA COMPLETA
-- Vamos a ver en qué "casa" (tenant_id) vive realmente cada uno.
SELECT 
    full_name, 
    email, 
    tenant_id, 
    status 
FROM public.user_profiles
ORDER BY created_at DESC;