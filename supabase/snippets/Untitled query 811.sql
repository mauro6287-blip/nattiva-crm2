-- 1. Asegurar que RLS esté activado (Buena práctica)
ALTER TABLE public.benefits_catalog ENABLE ROW LEVEL SECURITY;

-- 2. PERMISO DE LECTURA (Todos pueden ver el catálogo)
-- Importante: Ponemos "true" para que luego la API pública también pueda leerlo.
CREATE POLICY "Ver Catalogo Publico"
ON public.benefits_catalog FOR SELECT
USING (true);

-- 3. PERMISO DE ESCRITURA (Solo usuarios logueados pueden crear/editar)
-- Esto permite INSERT, UPDATE y DELETE a usuarios autenticados (Tú)
CREATE POLICY "Admin Gestiona Catalogo"
ON public.benefits_catalog FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);