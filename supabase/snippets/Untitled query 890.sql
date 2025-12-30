-- 1. Primero, creamos el "espejo" en la tabla pública users
-- (Puede que algunas columnas varíen, pero intentaremos con las estándar)
INSERT INTO public.users (id, email, full_name, created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001', -- Mismo ID que en auth
  'admin@sindicato.cl',
  'Admin Sindicato',
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Ahora sí, vinculamos el perfil (esto ya no debería fallar)
INSERT INTO public.user_profiles (user_id, tenant_id, role, full_name, created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'admin',
  'Admin Sindicato',
  now()
)
ON CONFLICT (user_id) DO UPDATE
SET 
  tenant_id = EXCLUDED.tenant_id,
  role = 'admin';