-- Limpiamos el ID para hacer la prueba desde cero
UPDATE public.user_profiles 
SET goodbarber_app_id = NULL 
WHERE email = 'contacto@demo.com';

-- Verificamos que esté limpio (debe salir NULL en la columna id)
SELECT email, goodbarber_app_id FROM public.user_profiles WHERE email = 'contacto@demo.com';