-- 1. CREAR LA DEFINICIÓN OFICIAL DEL CAMPO "TALLA"
-- Esto hará que aparezca la cajita bonita en el formulario
INSERT INTO public.organization_fields (tenant_id, key, label, type, is_active)
VALUES (
    (SELECT tenant_id FROM public.user_profiles WHERE email = 'admin@sindicato.cl' LIMIT 1),
    'talla',
    'Talla de Camisa',
    'text',
    true
)
ON CONFLICT DO NOTHING;

-- 2. MIGRAR LOS DATOS (De la columna sucia a la limpia)
-- Mueve el valor de 'D595...' a 'talla' solo si existe
UPDATE public.user_profiles
SET custom_data = jsonb_set(
    COALESCE(custom_data, '{}'::jsonb), 
    '{talla}', 
    custom_data->'D595A382-6F6C-4DF8-AEC8-34C96FC8EE65'
)
WHERE custom_data->'D595A382-6F6C-4DF8-AEC8-34C96FC8EE65' IS NOT NULL;

-- 3. ELIMINAR LA BASURA
-- Borramos la clave vieja y cualquier 'undefined' que haya quedado
UPDATE public.user_profiles
SET custom_data = (custom_data - 'D595A382-6F6C-4DF8-AEC8-34C96FC8EE65' - 'undefined');