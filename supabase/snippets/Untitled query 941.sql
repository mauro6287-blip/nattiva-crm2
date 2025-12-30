-- 1. CREAR LA TABLA DE DEFINICIONES
-- Aquí se guardarán los nombres de tus campos (Ej: "Talla Camisa", "Cargas")
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL, -- 'text', 'number', 'date', 'select'
    is_required BOOLEAN DEFAULT false,
    options TEXT[],           -- Para opciones de select
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. AGREGAR LA COLUMNA AL PERFIL DE SOCIOS
-- Aquí se guardarán los datos reales de cada persona (Ej: {"Talla": "XL"})
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}';

-- 3. ACTIVAR SEGURIDAD (RLS)
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

-- 4. DAR PERMISOS (Policies)
-- Primero borramos políticas viejas por si acaso, para evitar errores de duplicado
DROP POLICY IF EXISTS "Admin gestiona definiciones" ON public.custom_field_definitions;
DROP POLICY IF EXISTS "Lectura publica definiciones" ON public.custom_field_definitions;

-- Permiso total para ti (Admin conectado)
CREATE POLICY "Admin gestiona definiciones"
ON public.custom_field_definitions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Permiso de lectura para que el formulario sepa qué campos dibujar
CREATE POLICY "Lectura publica definiciones"
ON public.custom_field_definitions FOR SELECT
USING (true);