-- 1. Confirmar si el dato realmente existe (Solo para que tú lo veas aquí)
SELECT * FROM public.payment_audit_logs;

-- 2. Habilitar la seguridad (Por si no estaba)
ALTER TABLE public.payment_audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. CREAR EL PERMISO (La llave maestra)
-- Esto le dice a Supabase: "Deja que cualquier usuario conectado vea los logs"
CREATE POLICY "Permitir ver logs a usuarios conectados"
ON public.payment_audit_logs FOR SELECT
TO authenticated
USING (true);

-- 4. Permitir insertar (Para que el simulador no falle por permisos en el futuro)
CREATE POLICY "Permitir insertar logs"
ON public.payment_audit_logs FOR INSERT
TO authenticated, anon
WITH CHECK (true);