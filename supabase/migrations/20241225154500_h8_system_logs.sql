-- Hito 8: Observability (System Logs)

-- 1. Create system_logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
    id uuid primary key default gen_random_uuid(),
    timestamp timestamptz default now(),
    level text not null check (level in ('INFO', 'WARN', 'ERROR', 'CRITICAL')),
    tenant_id uuid references public.tenants(id) on delete set null,
    actor_id uuid references auth.users(id) on delete set null,
    event_type text not null,
    request_id text,
    duration_ms integer,
    metadata jsonb default '{}'::jsonb
);

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_system_logs_tenant_id ON public.system_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON public.system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON public.system_logs(event_type);

-- 3. RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Admins/SuperAdmins can VIEW logs for their tenant (or all if superadmin)
-- For MVP, let's allow "Admin" role to view logs of their tenant.
CREATE POLICY "Admins view tenant logs" ON public.system_logs
FOR SELECT
USING (
    tenant_id = public.get_my_tenant_id() 
    AND 
    public.get_my_role_code() IN ('admin', 'superadmin')
);

-- Service Role can CRUD (mostly Insert)
CREATE POLICY "Service Role Full Access" ON public.system_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- We might want to allow authenticated users to *insert* logs via a secure function if client-logging is needed??
-- For now, this is backend logging, so Service Role is sufficient for insertion.

-- 4. RPC for Dashboard Metrics (Optional but efficient)
CREATE OR REPLACE FUNCTION public.get_system_health_metrics(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    error_count int;
    total_count int;
    avg_duration numeric;
    top_errors jsonb;
BEGIN
    -- Error Rate (Last 24h)
    SELECT count(*) INTO total_count FROM public.system_logs 
    WHERE tenant_id = p_tenant_id AND timestamp > (now() - interval '24 hours');

    SELECT count(*) INTO error_count FROM public.system_logs 
    WHERE tenant_id = p_tenant_id AND timestamp > (now() - interval '24 hours') AND level IN ('ERROR', 'CRITICAL');

    -- Avg Duration (Last 24h, for checks)
    SELECT avg(duration_ms) INTO avg_duration FROM public.system_logs 
    WHERE tenant_id = p_tenant_id AND timestamp > (now() - interval '24 hours') AND duration_ms IS NOT NULL;

    -- Top Errors
    SELECT jsonb_agg(t) INTO top_errors FROM (
        SELECT event_type, count(*) as count
        FROM public.system_logs
        WHERE tenant_id = p_tenant_id AND timestamp > (now() - interval '24 hours') AND level IN ('ERROR', 'CRITICAL')
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 5
    ) t;

    RETURN jsonb_build_object(
        'total_24h', total_count,
        'errors_24h', error_count,
        'avg_duration_ms', COALESCE(round(avg_duration, 0), 0),
        'top_errors', COALESCE(top_errors, '[]'::jsonb)
    );
END;
$$;
