-- Create Analytics Events Table (Re-run safe)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL, 
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors on re-run
DROP POLICY IF EXISTS "Users can view events of their tenant" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert events for their tenant" ON public.analytics_events;

-- Policies for Analytics Events
CREATE POLICY "Users can view events of their tenant" 
ON public.analytics_events FOR SELECT 
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert events for their tenant" 
ON public.analytics_events FOR INSERT 
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()
    )
);

-- KPI View
-- Handle type mismatch: family_members.tenant_id is TEXT (from previous implementations?) while user_profiles.tenant_id is UUID.
-- We cast to UUID for consistent comparison if possible, or text.
CREATE OR REPLACE VIEW public.view_tenant_kpis AS
SELECT 
    up.tenant_id,
    COUNT(up.id) as total_socios,
    COUNT(CASE WHEN up.rut IS NOT NULL THEN 1 END) as socios_con_rut,
    (
        SELECT COUNT(*) 
        FROM public.family_members fm 
        -- Cast fm.tenant_id to UUID if it's text, or handling the join carefully.
        -- If fm.tenant_id is text, we cast up.tenant_id to text to match.
        WHERE fm.tenant_id::text = up.tenant_id::text
    ) as total_cargas
FROM public.user_profiles up
GROUP BY up.tenant_id;

-- Grant access
GRANT SELECT ON public.view_tenant_kpis TO authenticated;
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
