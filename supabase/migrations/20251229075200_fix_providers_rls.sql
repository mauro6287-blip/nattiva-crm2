-- Fix RLS for providers to ensure full management access for Tenant Admins
-- Dropping potential old policies to avoid conflicts
DROP POLICY IF EXISTS "Admin ve sus proveedores" ON public.providers;
DROP POLICY IF EXISTS "Tenant Admins can manage providers" ON public.providers;
-- Also dropping the "Provider Users can view their own provider" just in case we want to redefine or keep it. 
-- The user request focused on Admin management. I will keep the provider user one or re-add it if needed, 
-- but ensuring the Admin one is 'FOR ALL'.

-- Re-creating the Admin Policy (Full Access)
CREATE POLICY "Gestión Total Proveedores" ON public.providers
FOR ALL
USING (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
)
WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
);

-- Ensure Provider Users can still see their provider (for the Portal)
-- We need to check if this policy already exists or if we should re-assert it.
-- Previous migration named it: "Provider Users can view their own provider"
-- Let's leave it be if it exists, or re-create it to be safe if I dropped "Admin ve sus proveedores" which might have overlapped?
-- No, the names are distinct. "Tenant Admins can manage providers" was the one created in 20251228194000.
