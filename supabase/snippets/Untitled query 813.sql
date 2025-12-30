INSERT INTO public.user_profiles (user_id, tenant_id, role, full_name, created_at)
VALUES (
  '9ae1c5d0-d230-408f-be2d-322a04a8ece8', -- ESTE ES TU ID REAL
  '11111111-1111-1111-1111-111111111111', -- ID del Sindicato Demo
  'admin',
  'Admin Sindicato',
  now()
)
ON CONFLICT (user_id) DO UPDATE
SET 
  tenant_id = EXCLUDED.tenant_id,
  role = 'admin';