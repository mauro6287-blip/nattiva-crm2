-- Fixed RLS Policy to avoid Infinite Recursion
-- The issue was separate policies causing function evaluation loops.
-- We consolidate into single policies with Short-Circuiting (OR).

BEGIN;

-- Drop existing separate policies
DROP POLICY IF EXISTS "View Own Profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin View Tenant Profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Update Own Profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin Update Tenant Profiles" ON public.user_profiles;

-- Create Consolidated SELECT Policy
-- Logic: If it's MY profile, allow (True OR ... -> True). No function call.
-- If NOT my profile, check if I am Admin in same tenant.
CREATE POLICY "Unified Select Profile" ON public.user_profiles
FOR SELECT
USING (
    (auth.uid() = id) 
    OR 
    (tenant_id = public.get_my_tenant_id() AND public.get_my_role_code() IN ('admin', 'superadmin'))
);

-- Create Consolidated UPDATE Policy
CREATE POLICY "Unified Update Profile" ON public.user_profiles
FOR UPDATE
USING (
    (auth.uid() = id) 
    OR 
    (tenant_id = public.get_my_tenant_id() AND public.get_my_role_code() IN ('admin', 'superadmin'))
);

COMMIT;
