-- Fix RLS for marketing_logs to allow INSERT
-- Previous migration only added SELECT policy.

CREATE POLICY "Users can insert email logs for their tenant" 
ON public.marketing_logs FOR INSERT 
WITH CHECK (
    campaign_id IN (
        SELECT id FROM public.marketing_campaigns 
        WHERE tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
    )
);
