-- Create Providers Table
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL, -- The union/tenant that owns this provider relationship
    name TEXT NOT NULL,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Provider Branches Table
CREATE TABLE IF NOT EXISTS public.provider_branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Provider Users Table (Access Control)
CREATE TABLE IF NOT EXISTS public.provider_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'operator', -- admin, operator
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(provider_id, user_id)
);

-- Enable RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_users ENABLE ROW LEVEL SECURITY;

-- Policies for Providers
-- 1. Tenant Admins can view/manage their providers
CREATE POLICY "Tenant Admins can manage providers" 
ON public.providers
USING (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
);

-- 2. Provider Users can view THEIR provider
CREATE POLICY "Provider Users can view their own provider" 
ON public.providers FOR SELECT
USING (
    id IN (SELECT provider_id FROM public.provider_users WHERE user_id = auth.uid())
);

-- Policies for Provider Branches
-- 1. Tenant Admins
CREATE POLICY "Tenant Admins can manage branches" 
ON public.provider_branches
USING (
    provider_id IN (
        SELECT id FROM public.providers 
        WHERE tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
    )
);

-- 2. Provider Users
CREATE POLICY "Provider Users can view their branches" 
ON public.provider_branches FOR SELECT
USING (
    provider_id IN (SELECT provider_id FROM public.provider_users WHERE user_id = auth.uid())
);

CREATE POLICY "Provider Users can manage their branches" 
ON public.provider_branches FOR INSERT
WITH CHECK (
    provider_id IN (SELECT provider_id FROM public.provider_users WHERE user_id = auth.uid())
);
-- Update/Delete policies for provider users as needed (usually admin role check, simplistic for now)
CREATE POLICY "Provider Users can update their branches" 
ON public.provider_branches FOR UPDATE
USING (
    provider_id IN (SELECT provider_id FROM public.provider_users WHERE user_id = auth.uid())
);


-- Policies for Provider Users
-- 1. Tenant Admins can view/invite users
CREATE POLICY "Tenant Admins can manage provider users" 
ON public.provider_users
USING (
    provider_id IN (
        SELECT id FROM public.providers 
        WHERE tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
    )
);

-- 2. Provider Admins can view/invite users (Optional, skipped for MVP simplicity, assume only main admin invites)

-- Indexes
CREATE INDEX IF NOT EXISTS idx_providers_tenant ON public.providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_provider_branches_provider ON public.provider_branches(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_users_user ON public.provider_users(user_id);

-- Permissions
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.provider_branches TO authenticated;
GRANT ALL ON public.provider_users TO authenticated;
