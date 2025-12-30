-- 1. Crear la tabla tenants (que desapareció)
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Insertar el Sindicato Demo con el ID exacto que tiene tu usuario
INSERT INTO public.tenants (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Sindicato Demo')
ON CONFLICT (id) DO NOTHING;

-- 3. (Opcional pero recomendado) Asegurar permisos para que todos puedan leer el nombre del sindicato
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants are viewable by everyone" 
ON public.tenants FOR SELECT 
USING (true);