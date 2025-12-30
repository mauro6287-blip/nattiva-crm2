-- 1. CREAR LA TABLA (Que faltaba)
CREATE TABLE IF NOT EXISTS public.payment_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email_subject TEXT,
    email_body TEXT,
    status TEXT DEFAULT 'ORPHAN', -- Valores: MATCHED, ORPHAN
    matched_order_code TEXT
);

-- 2. HABILITAR SEGURIDAD (RLS)
ALTER TABLE public.payment_audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. DAR PERMISOS (Para que el Dashboard la vea y el Simulador escriba)
-- Permitir lectura (Dashboard)
CREATE POLICY "Permitir ver logs a usuarios conectados"
ON public.payment_audit_logs FOR SELECT
TO authenticated
USING (true);

-- Permitir escritura (Simulador/Webhook)
CREATE POLICY "Permitir insertar logs"
ON public.payment_audit_logs FOR INSERT
TO authenticated, anon
WITH CHECK (true);