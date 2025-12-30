
DO $$
DECLARE
  v_user_id uuid := '9ae1c5d0-d230-408f-be2d-322a04a8ece8';
  v_tenant_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO user_profiles (user_id, tenant_id, role, full_name)
  VALUES (v_user_id, v_tenant_id, 'admin', 'Administrador Global')
  ON CONFLICT (user_id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id;
END $$;
