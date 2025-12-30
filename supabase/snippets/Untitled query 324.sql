-- 1. LIMPIEZA PREVIA (Por si quedó algo a medias)
DROP POLICY IF EXISTS "Acceso total a cargas de mi organizacion" ON public.family_members;

-- 2. ASEGURAR QUE LA TABLA EXISTE
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tenant_id TEXT, 
    relationship TEXT NOT NULL,
    full_name TEXT NOT NULL,
    rut TEXT,
    birth_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ACTIVAR SEGURIDAD
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 4. LA POLÍTICA CORREGIDA (Con el traductor ::text)
-- Fíjate en el "tenant_id::text", esa es la clave del arreglo.
CREATE POLICY "Acceso total a cargas de mi organizacion" ON public.family_members
FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id::text FROM public.user_profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id::text FROM public.user_profiles WHERE id = auth.uid()
    )
);