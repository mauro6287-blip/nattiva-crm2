BEGIN;

-- 1. Identificar quién eres y forzar tu ascenso a ADMIN
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE id = auth.uid();

-- 2. Confirmación visual (Te mostrará tu rol actual)
SELECT email, role, tenant_id 
FROM public.user_profiles 
WHERE id = auth.uid();

COMMIT;