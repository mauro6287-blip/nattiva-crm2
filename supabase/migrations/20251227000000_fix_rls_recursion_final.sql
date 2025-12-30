-- Migration: Fix RLS Infinite Recursion using JWT Metadata
-- Date: 2025-12-27
-- Description: Caches tenant_id and role_code in auth.users.raw_app_meta_data to avoid RLS loops.

BEGIN;

-- 1. Create Function to Sync Metadata (Profile -> Auth System)
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role_code text;
BEGIN
    -- Get the role code
    SELECT code INTO v_role_code FROM public.roles WHERE id = NEW.role_id;

    -- Update auth.users metadata
    -- We use a direct update to auth.users. This requires SUPERUSER or proper grants.
    -- In Supabase, postgres role usually has access.
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'tenant_id', NEW.tenant_id,
            'role_code', v_role_code
        )
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$;

-- Ensure it is owned by postgres to have permission on auth.users
ALTER FUNCTION public.sync_user_metadata() OWNER TO postgres;

-- 2. Create Trigger
DROP TRIGGER IF EXISTS on_profile_change_sync_meta ON public.user_profiles;

CREATE TRIGGER on_profile_change_sync_meta
AFTER INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_metadata();

-- 3. Backfill Existing Users (Important!)
DO $$
DECLARE
    r RECORD;
    v_role_code text;
BEGIN
    FOR r IN SELECT * FROM public.user_profiles LOOP
        SELECT code INTO v_role_code FROM public.roles WHERE id = r.role_id;
        
        UPDATE auth.users
        SET raw_app_meta_data = 
            COALESCE(raw_app_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'tenant_id', r.tenant_id,
                'role_code', v_role_code
            )
        WHERE id = r.id;
    END LOOP;
END;
$$;

-- 4. Update Helper Functions to read from JWT first
-- This breaks the recursion because checking the JWT doesn't touch the table.

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
    -- 1. Try to get from JWT (Fast path, no recursion)
    v_jwt := auth.jwt();
    IF v_jwt ? 'app_metadata' AND v_jwt -> 'app_metadata' ? 'tenant_id' THEN
        v_tenant_id := (v_jwt -> 'app_metadata' ->> 'tenant_id')::uuid;
        RETURN v_tenant_id;
    END IF;

    -- 2. Fallback to DB (Slow path, risk of recursion if not careful)
    -- This should only happen if metadata isn't synced yet or user hasn't refreshed token.
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
