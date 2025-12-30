-- Hito 7: Security Hardening (RLS & Rate Limits)

-- 1. Create Rate Limits Table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id uuid primary key default gen_random_uuid(),
    ip_address text not null,
    endpoint text not null,
    request_count int default 1,
    last_request_at timestamptz default now(),
    UNIQUE (ip_address, endpoint)
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (Internal use)
CREATE POLICY "Service Role Full Access" ON public.rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);
-- We might need anon access if we want middleware to write to it without a service key? 
-- But typically middleware has service key or we use a function. 
-- Let's stick to Service Role for now and assume Middleware uses SERVICE_KEY or we create a secure RPC.

-- 2. Add tenant_id to system_events
ALTER TABLE public.system_events ADD COLUMN IF NOT EXISTS tenant_id uuid references public.tenants(id) on delete cascade;
-- We need to backfill existing events if any? 
-- update public.system_events set tenant_id = (select id from public.tenants limit 1) where tenant_id is null; 
-- (Skipping backfill for now as it might be empty or not critical for MVP dev)

-- 3. Security Helper Functions (SECURITY DEFINER to bypass RLS recursion)
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_role_code()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.code
  FROM public.user_profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = auth.uid();
$$;

-- 4. RLS POLICIES

-- Common variable for easier logic? No, just use functions.

-- Drop insecure "Allow all"
DROP POLICY IF EXISTS "Allow all" ON public.tickets;
DROP POLICY IF EXISTS "Allow all" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all" ON public.validation_events;
DROP POLICY IF EXISTS "Allow all" ON public.content_items;
-- note: audit_log policies presumably stay or we fix them too? Prompt didn't strictly list it but good practice.
-- Prompt listed: tickets, user_profiles, benefit_validations, content_items, system_events.

-- A. TICKETS
-- SELECT: Users can see tickets of their tenant.
CREATE POLICY "Tenant Isolation Select" ON public.tickets
FOR SELECT
USING (tenant_id = public.get_my_tenant_id());

-- INSERT: Users can create tickets in their tenant.
CREATE POLICY "Tenant Isolation Insert" ON public.tickets
FOR INSERT
WITH CHECK (tenant_id = public.get_my_tenant_id());

-- UPDATE: Users can update tickets in their tenant.
CREATE POLICY "Tenant Isolation Update" ON public.tickets
FOR UPDATE
USING (tenant_id = public.get_my_tenant_id());

-- DELETE: Only Admin/SuperAdmin?
-- Let's say Admin can delete.
CREATE POLICY "Admin Delete" ON public.tickets
FOR DELETE
USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role_code() IN ('admin', 'superadmin'));


-- B. USER_PROFILES
-- SELECT: Users see themselves OR Admin sees all in tenant.
CREATE POLICY "View Own Profile" ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admin View Tenant Profiles" ON public.user_profiles
FOR SELECT
USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role_code() IN ('admin', 'superadmin'));

-- UPDATE: Users can update own profile (maybe minimal fields), Admin updates all in tenant.
CREATE POLICY "Update Own Profile" ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admin Update Tenant Profiles" ON public.user_profiles
FOR UPDATE
USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role_code() IN ('admin', 'superadmin'));


-- C. VALIDATION_EVENTS (benefit_validations)
CREATE POLICY "Tenant Isolation Validation Events" ON public.validation_events
FOR ALL
USING (tenant_id = public.get_my_tenant_id());


-- D. CONTENT_ITEMS
CREATE POLICY "Tenant Isolation Content Items" ON public.content_items
FOR ALL
USING (tenant_id = public.get_my_tenant_id());


-- E. SYSTEM_EVENTS
-- Need to drop existing policies first?
-- Existing: "Allow read auth", "Allow all service"
DROP POLICY IF EXISTS "Allow read auth" ON public.system_events;
DROP POLICY IF EXISTS "Allow all service" ON public.system_events;

CREATE POLICY "Tenant Isolation System Events" ON public.system_events
FOR SELECT
USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "Service Write System Events" ON public.system_events
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 5. Rate Limit RPC
-- Function to check and update rate limit atomically
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_ip_address text,
    p_endpoint text,
    p_limit int,
    p_window_seconds int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count int;
    last_time timestamptz;
BEGIN
    INSERT INTO public.rate_limits (ip_address, endpoint, request_count, last_request_at)
    VALUES (p_ip_address, p_endpoint, 1, now())
    ON CONFLICT (ip_address, endpoint)
    DO UPDATE SET
        request_count = CASE
            WHEN (now() - public.rate_limits.last_request_at) > (p_window_seconds || ' seconds')::interval THEN 1
            ELSE public.rate_limits.request_count + 1
        END,
        last_request_at = now()
    RETURNING request_count INTO current_count;

    IF current_count > p_limit THEN
        RETURN false; -- Limit exceeded
    ELSE
        RETURN true; -- OK
    END IF;
END;
$$;
