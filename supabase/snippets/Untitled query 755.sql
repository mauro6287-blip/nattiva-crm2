-- 1. CREAR LA TABLA (Que el IDE olvidó)
CREATE TABLE IF NOT EXISTS public.benefits_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_name TEXT NOT NULL, -- Ej: Gasco, Cineplanet
    product_name TEXT NOT NULL,  -- Ej: Vale 15kg
    price NUMERIC NOT NULL,
    original_price NUMERIC,      -- Para mostrar "Antes: $20.000"
    stock_limit INTEGER,         -- NULL = Infinito
    max_per_user INTEGER DEFAULT 2, -- Límite mensual por socio
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. HABILITAR SEGURIDAD (RLS)
ALTER TABLE public.benefits_catalog ENABLE ROW LEVEL SECURITY;

-- 3. DAR PERMISOS (Las llaves maestras)

-- Permiso para que TODOS (incluso la App móvil después) puedan LEER el catálogo
CREATE POLICY "Publico lee catalogo activo"
ON public.benefits_catalog FOR SELECT
USING (true);

-- Permiso para que TÚ (Admin logueado) puedas CREAR, EDITAR y BORRAR
CREATE POLICY "Admin gestiona todo"
ON public.benefits_catalog FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);