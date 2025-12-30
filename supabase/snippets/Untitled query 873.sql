SELECT 
    t.slug, 
    t.config, 
    up.email 
FROM public.tenants t
JOIN public.user_profiles up ON up.tenant_id = t.id
WHERE up.email = 'venta2@sindicato.cl';