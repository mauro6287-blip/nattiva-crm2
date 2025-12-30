INSERT INTO public.user_profiles (user_id, tenant_id, role, full_name, created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001', -- El mismo ID que creamos en auth.users
  '11111111-1111-1111-1111-111111111111', -- El ID del Sindicato Demo
  'admin',                                -- Ahora el rol es texto directo
  'Admin Sindicato',
  now()
)
ON CONFLICT (user_id) DO UPDATE
SET 
  tenant_id = EXCLUDED.tenant_id,
  role = 'admin';