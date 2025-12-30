-- Add columns to tenants table for Onboarding/Provisioning
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'suspended')),
ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Index for slug lookups (finding tenant by domain/url)
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

-- Ensure RLS allows SuperAdmins to insert/update tenants
-- (Assuming existing policies might be restrictive, we verify here)
-- Note: 'create_client' in admin action uses SERVICE_ROLE for provisioning usually, which bypasses RLS.
-- But for the frontend to query 'tenants' list, we might need policies.

-- Policy: SuperAdmins (role='superadmin' in user_profiles) can do EVERYTHING on tenants
CREATE POLICY "SuperAdmins can manage tenants"
ON public.tenants
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'superadmin'
    )
);

-- Migration for demo data support (optional, but good to have prepared)
-- (No extra schema needed for demo data, we just insert into existing tables)
