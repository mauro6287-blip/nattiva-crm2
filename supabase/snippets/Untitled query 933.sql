-- 1. CREAR LA TABLA DE CARGAS FAMILIARES
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE, -- Si se borra el socio, se borran sus cargas
    tenant_id TEXT, -- Para seguridad entre sindicatos
    relationship TEXT NOT NULL, -- 'Conyuge', 'Hijo', 'Padre'
    full_name TEXT NOT NULL,
    rut TEXT,
    birth_date DATE, -- Vital para los regalos de Navidad
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ACTIVAR SEGURIDAD (RLS)
-- Esto es crucial: Solo permite ver/editar las cargas que pertenecen a tu misma organización
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total a cargas de mi organizacion" ON public.family_members
FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()
    )
);
