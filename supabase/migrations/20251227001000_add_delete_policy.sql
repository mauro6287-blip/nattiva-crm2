-- Migration: Add DELETE Policy for User Profiles
-- Date: 2025-12-27
-- Description: Enables Admins to delete user profiles in their tenant.

BEGIN;

-- Create Consolidated DELETE Policy
CREATE POLICY "Unified Delete Profile" ON public.user_profiles
FOR DELETE
USING (
    -- User must be Admin/Superadmin in the same tenant
    (tenant_id = public.get_my_tenant_id() AND public.get_my_role_code() IN ('admin', 'superadmin'))
    -- Safety: Cannot delete yourself (Optional, but good practice to prevent accidental lockout)
    AND (auth.uid() <> id)
);

COMMIT;
