-- 1. Crear el usuario en auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@sindicato.cl',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Crear identidad (para que el login funcione)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'a0000000-0000-0000-0000-000000000001',
  '{"sub":"a0000000-0000-0000-0000-000000000001","email":"admin@sindicato.cl"}',
  'email',
  now(),
  now(),
  now()
) ON CONFLICT (user_id, provider) DO NOTHING;

-- 3. Crear Perfil vinculado al Tenant Demo
INSERT INTO public.user_profiles (id, tenant_id, role_id, email, full_name, is_active)
SELECT 
  'a0000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  id, 
  'admin@sindicato.cl',
  'Admin Sindicato',
  true
FROM public.roles 
WHERE code = 'admin' AND tenant_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT (id) DO NOTHING;