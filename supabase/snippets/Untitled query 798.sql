-- 1. FORZAR LA TALLA XL (La ponemos manualmente)
UPDATE public.user_profiles
SET custom_data = jsonb_set(custom_data, '{talla}', '"XL"')
WHERE email = 'juan@test.com';

-- 2. FORZAR EL BORRADO DE LA CLAVE VIEJA (Sin preguntar)
UPDATE public.user_profiles
SET custom_data = custom_data - 'D595A382-6F6C-4DF8-AEC8-34C96FC8EE65'
WHERE email = 'juan@test.com';

-- 3. LIMPIEZA EXTRA (Por si quedó basura 'undefined')
UPDATE public.user_profiles
SET custom_data = custom_data - 'undefined'
WHERE email = 'juan@test.com';