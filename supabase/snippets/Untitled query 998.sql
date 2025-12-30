-- 1. CREAR LA TABLA QUE FALTA (El Cerebro)
CREATE TABLE IF NOT EXISTS public.organization_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT, -- Usamos TEXT para máxima compatibilidad con lo que ya tienes
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    options JSONB, -- Para guardar opciones si es un desplegable
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ACTIVAR SEGURIDAD BÁSICA (Para que no de errores de permiso)
ALTER TABLE public.organization_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total a campos" ON public.organization_fields
FOR ALL USING (true) WITH CHECK (true);

-- 3. INSERTAR EL HELADO MANUALMENTE (Para recuperar tu configuración)
-- Usamos el ID de tu organización (el mismo de Admin y Juan Test)
INSERT INTO public.organization_fields (tenant_id, key, label, type, is_active)
VALUES (
    (SELECT tenant_id FROM public.user_profiles WHERE email = 'admin@sindicato.cl' LIMIT 1),
    'sabor_helado',
    'Sabor de helado',
    'text',
    true
);

-- 4. VERIFICAR QUE QUEDÓ GUARDADO
SELECT * FROM public.organization_fields;