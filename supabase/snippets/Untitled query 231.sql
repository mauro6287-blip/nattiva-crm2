-- VERIFICAR EL ESTADO DEL ADMIN
SELECT email, id, tenant_id 
FROM public.user_profiles 
WHERE email = 'admin@sindicato.cl';
