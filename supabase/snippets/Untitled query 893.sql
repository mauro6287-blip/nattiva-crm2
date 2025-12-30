BEGIN;

-- 1. Actualización usando tu Email como ancla (Más seguro que el Slug)
UPDATE public.tenants
SET config = config || '{"goodbarber": {"app_id": "888888", "api_key": "PRUEBA-FINAL"}}'::jsonb
WHERE id = (
    SELECT tenant_id 
    FROM public.user_profiles 
    WHERE email = 'venta2@sindicato.cl'
);

-- 2. Verificación Inmediata: ¿Qué tiene el config ahora?
SELECT config 
FROM public.tenants 
WHERE id = (
    SELECT tenant_id 
    FROM public.user_profiles 
    WHERE email = 'venta2@sindicato.cl'
);

COMMIT;