-- INYECCIÓN MANUAL DE CARGA FAMILIAR
INSERT INTO public.family_members (user_id, tenant_id, full_name, relationship, birth_date)
VALUES (
    (SELECT id FROM public.user_profiles WHERE email = 'juan@test.com' LIMIT 1), -- ID de Juan
    (SELECT tenant_id::text FROM public.user_profiles WHERE email = 'admin@sindicato.cl' LIMIT 1), -- Tu ID de Organización
    'Hijo Prueba SQL', -- Nombre
    'Hijo', -- Parentesco
    '2020-01-01' -- Fecha
);

-- VERIFICACIÓN INMEDIATA
SELECT * FROM public.family_members;