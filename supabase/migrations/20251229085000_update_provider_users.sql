-- Add Invite Columns to provider_users
ALTER TABLE public.provider_users 
ADD COLUMN IF NOT EXISTS invited_email TEXT,
ADD COLUMN IF NOT EXISTS invited_name TEXT;

-- Make user_id nullable if it wasn't already (it was implied nullable but let's be explicit/safe)
ALTER TABLE public.provider_users 
ALTER COLUMN user_id DROP NOT NULL;

-- Ensure we don't duplicate invites for same email in same provider
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_users_email 
ON public.provider_users(provider_id, invited_email) 
WHERE invited_email IS NOT NULL;
