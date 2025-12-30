-- Insertar Macros de prueba para el tenant actual
INSERT INTO public.support_macros (tenant_id, title, content)
SELECT 
    tenant_id, 
    'Saludo Inicial', 
    'Hola {{nombre}}, gracias por contactarnos. Hemos recibido tu solicitud y la estamos revisando.'
FROM public.user_profiles WHERE id = auth.uid();

INSERT INTO public.support_macros (tenant_id, title, content)
SELECT 
    tenant_id, 
    'Solicitud de RUT', 
    'Estimado/a, para avanzar con tu caso necesitamos que nos confirmes tu RUT y una foto de tu credencial.'
FROM public.user_profiles WHERE id = auth.uid();

INSERT INTO public.support_macros (tenant_id, title, content)
SELECT 
    tenant_id, 
    'Cierre de Caso', 
    'Nos alegra haberte ayudado. Procedemos a cerrar este ticket. ¡Que tengas buena tarde!'
FROM public.user_profiles WHERE id = auth.uid();