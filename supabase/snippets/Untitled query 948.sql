-- 1. CREAR EL CAMPO OFICIAL "TALLA"
-- Así el Admin tendrá control total sobre él (editar/borrar)
INSERT INTO public.organization_fields (tenant_id, key, label, type, is_active)
VALUES (
    (SELECT tenant_id FROM public.user_profiles WHERE email = 'admin@sindicato.cl' LIMIT 1),
    'talla',   -- La clave interna limpia
    'Talla Camisa', -- El nombre bonito
    'text',
    true
)
ON CONFLICT DO NOTHING; -- Si ya le diste clic antes, no pasa nada.

-- 2. LA GRAN MIGRACIÓN (Mover XL a Talla)
-- Buscamos el dato en la clave rara 'D595...' y lo movemos a 'talla'
UPDATE public.user_profiles
SET custom_data = jsonb_set(custom_data, '{talla}', custom_data->'D595A382-6F6C-4DF8-AEC8-34C96FC8EE65')
WHERE custom_data->>'D595A382-6F6C-4DF8-AEC8-34C96FC8EE65' IS NOT NULL;

-- 3. ELIMINAR LA BASURA (Borrar Undefined y el código raro)
-- Quitamos las claves que ya no sirven para que la ficha se vea limpia
UPDATE public.user_profiles
SET custom_data = (custom_data - 'undefined' - 'D595A382-6F6C-4DF8-AEC8-34C96FC8EE65');