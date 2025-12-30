-- Asegurar que el usuario Admin tenga un perfil válido vinculado al Sindicato Demo
INSERT INTO public.user_profiles (id, tenant_id, email, full_name, is_active, role_id)
VALUES (
  'a0000000-0000-0000-0000-000000000001', -- ID del usuario Auth
  '11111111-1111-1111-1111-111111111111', -- ID del Tenant Demo
  'admin@sindicato.cl',
  'Admin Sindicato',
  true,
  (SELECT id FROM public.roles WHERE code = 'admin' LIMIT 1) -- Busca el ID del rol Admin
)
ON CONFLICT (id) DO UPDATE
SET 
  tenant_id = EXCLUDED.tenant_id,
  is_active = true;
  