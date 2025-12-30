-- Migration: Fix RLS Recursion by Dropping ALL Legacy Policies
-- Date: 2025-12-27
-- Description: Drops ALL policies on user_profiles dynamically to ensure no legacy recursive policies remain.

BEGIN;

-- 1. DROP ALL POLICIES ON user_profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', r.policyname);
    END LOOP;
END;
$$;

-- 2. Re-Apply Unified Policies (Safe & Optimized)

-- SELECT: See own profile OR Admin sees Tenant's profiles
CREATE POLICY "Unified Select Profile" ON public.user_profiles
FOR SELECT
USING (
    (auth.uid() = id) 
    OR 
    (tenant_id = public.get_my_tenant_id() AND public.get_my_role_code() IN ('admin', 'superadmin'))
);

-- UPDATE: Update own profile OR Admin updates Tenant's profiles
CREATE POLICY "Unified Update Profile" ON public.user_profiles
FOR UPDATE
USING (
    (auth.uid() = id) 
    OR 
    (tenant_id = public.get_my_tenant_id() AND public.get_my_role_code() IN ('admin', 'superadmin'))
);

-- INSERT: Usually handled by triggers or specific logic, but let's allow users to insert themselves if needed?
-- Or generally users are created by invites/admin. 
-- Assuming standard flow:
CREATE POLICY "Unified Insert Profile" ON public.user_profiles
FOR INSERT
WITH CHECK (
    -- Allow inserting own profile (e.g. at signup)
    (auth.uid() = id)
    OR
    -- Allow Admin to create users
    (public.get_my_role_code() IN ('admin', 'superadmin'))
);

-- 3. Ensure Helpers are safe (Re-run definition to be 100% sure)
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant_id uuid;
    v_jwt jsonb;
BEGIN
    -- 1. Try to get from JWT (Fast path)
    v_jwt := auth.jwt();
    IF v_jwt ? 'app_metadata' AND v_jwt -> 'app_metadata' ? 'tenant_id' THEN
        v_tenant_id := (v_jwt -> 'app_metadata' ->> 'tenant_id')::uuid;
        RETURN v_tenant_id;
    END IF;

    -- 2. Fallback to DB (Safe path for Security Definer)
    SELECT tenant_id INTO v_tenant_id
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    RETURN v_tenant_id;
END;
$$;

ALTER FUNCTION public.get_my_tenant_id() OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.get_my_role_code()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role_code text;
    v_jwt jsonb;
BEGIN
    -- 1. Try to get from JWT
    v_jwt := auth.jwt();
    IF v_jwt ? 'app_metadata' AND v_jwt -> 'app_metadata' ? 'role_code' THEN
        v_role_code := v_jwt -> 'app_metadata' ->> 'role_code';
        RETURN v_role_code;
    END IF;

    -- 2. Fallback to DB
    SELECT r.code INTO v_role_code
    FROM public.user_profiles p
    JOIN public.roles r ON r.id = p.role_id
    WHERE p.id = auth.uid();
    
    RETURN v_role_code;
END;
$$;

ALTER FUNCTION public.get_my_role_code() OWNER TO postgres;

COMMIT;
