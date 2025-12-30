-- 1. TABLA DE EVENTOS (El historial)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.user_profiles(tenant_id),
    user_id uuid REFERENCES public.user_profiles(id),
    event_name text NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Habilitar seguridad (RLS) para que nadie vea datos de otro sindicato
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver eventos de mi sindicato" ON public.analytics_events
FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
);

-- 2. VISTA DE KPIs (La calculadora automática)
-- Esta vista cuenta rápido sin que el código tenga que sumar 1 por 1
CREATE OR REPLACE VIEW public.view_tenant_kpis AS
SELECT 
    tenant_id,
    count(*) as total_socios,
    count(*) FILTER (WHERE rut IS NOT NULL) as socios_con_rut,
    count(*) FILTER (WHERE custom_data->>'estado' = 'verified' OR custom_data->>'status' = 'verified') as socios_verificados
FROM public.user_profiles
GROUP BY tenant_id;