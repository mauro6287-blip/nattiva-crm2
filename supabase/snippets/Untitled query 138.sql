-- 1. Crear la tabla de Órdenes de Pago
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id),
    order_code TEXT UNIQUE NOT NULL,
    amount_expected NUMERIC,
    status TEXT DEFAULT 'PENDING', -- Valores: PENDING, PAID, REJECTED
    raw_proof TEXT, -- Para guardar el texto del correo como evidencia
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar seguridad (RLS)
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de acceso (Permisos)
-- Permitir que el usuario vea sus propias órdenes
CREATE POLICY "Usuarios ven sus propias ordenes" 
ON public.payment_orders FOR SELECT 
USING (auth.uid() = user_id);

-- Permitir que el usuario CREE órdenes nuevas
CREATE POLICY "Usuarios crean ordenes" 
ON public.payment_orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);