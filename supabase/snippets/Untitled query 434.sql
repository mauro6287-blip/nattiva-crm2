UPDATE public.tenants 
SET config = jsonb_set(COALESCE(config, '{}'), '{goodbarber}', '{"app_id": "888888", "api_key": "test-sql"}')
WHERE slug = 'demo-ventas';