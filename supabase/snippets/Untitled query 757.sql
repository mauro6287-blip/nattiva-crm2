UPDATE public.tenants
SET config = config || '{"goodbarber": {"app_id": "888888", "api_key": "PRUEBA-FINAL"}}'::jsonb
WHERE slug = 'demo-ventas';