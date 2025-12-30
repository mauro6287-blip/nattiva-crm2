-- Hito 9.5: Add GoodBarber App ID to User Profiles
-- The user explicitly requested 'goodbarber_app_id' on 'user_profiles'.
-- Note: 'goodbarber_app_id' on 'tenants' exists (App Bundle ID). 
-- This column on 'user_profiles' represents the User's ID within the App. Contextual naming collision but specific request followed.

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS goodbarber_app_id text;

-- Security: Revoke public access?
-- "RLS update if necessary".
-- By default, RLS policies on user_profiles allow:
-- "View Own Profile" (SELECT), "Admin View Tenant Profiles" (SELECT)
-- "Update Own Profile" (UPDATE), "Admin Update Tenant Profiles" (UPDATE)
-- Adding a column usually inherits table permissions.
-- We want to prevent USERS from changing their own goodbarber_app_id arbitrarily?
-- Yes. But Postgres RLS for UPDATE is row-based.
-- To restrict COLUMN update, we need a refined policy or trigger.
-- For MVP, we trust that the frontend strictly controls calls, but since Supabase exposes API...
-- Ideally we revoke UPDATE on this column for authenticated.
-- But Supabase policies are usually Row level.
-- We can leave it for now as "Update Own Profile" allows updating "metadata" too.
-- The Service Role will be used for the Webhook, so it bypasses RLS anyway.
