UPDATE public.tenants
SET config = jsonb_set(COALESCE(config, '{}'), '{goodbarber}', '{"app_id": "888888", "api_key": "SQL-EXITOSO"}')
WHERE id = (
    SELECT tenant_id 
    FROM public.user_profiles 
    WHERE email = 'venta2@sindicato.cl'
);