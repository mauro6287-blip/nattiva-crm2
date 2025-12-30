-- Create Marketing Templates Table
CREATE TABLE IF NOT EXISTS public.marketing_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    subject TEXT,
    html_content TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    segment_criteria JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'draft', -- draft, scheduled, sent, processing, completed
    scheduled_at TIMESTAMPTZ,
    template_id UUID REFERENCES public.marketing_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Marketing Logs Table
CREATE TABLE IF NOT EXISTS public.marketing_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL, -- sent, failed, opened
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Templates
CREATE POLICY "Users can view templates of their tenant" 
ON public.marketing_templates FOR SELECT 
USING (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can insert templates for their tenant" 
ON public.marketing_templates FOR INSERT 
WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update templates of their tenant" 
ON public.marketing_templates FOR UPDATE 
USING (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can delete templates of their tenant" 
ON public.marketing_templates FOR DELETE 
USING (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
);

-- Policies for Campaigns
CREATE POLICY "Users can view campaigns of their tenant" 
ON public.marketing_campaigns FOR SELECT 
USING (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can insert campaigns for their tenant" 
ON public.marketing_campaigns FOR INSERT 
WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update campaigns of their tenant" 
ON public.marketing_campaigns FOR UPDATE 
USING (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
);

-- Policies for Logs
CREATE POLICY "Users can view email logs of their tenant" 
ON public.marketing_logs FOR SELECT 
USING (
    campaign_id IN (
        SELECT id FROM public.marketing_campaigns 
        WHERE tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_tenant ON public.marketing_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_logs_campaign ON public.marketing_logs(campaign_id);

-- Permissions
GRANT ALL ON public.marketing_templates TO authenticated;
GRANT ALL ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_logs TO authenticated;
