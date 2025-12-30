-- Add rut column to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS rut text;

-- Create index for high performance search
CREATE INDEX IF NOT EXISTS idx_user_profiles_rut ON public.user_profiles(rut);

-- Migrate existing data from custom_data->>'rut' to the new column
-- (Removed to avoid error: column "custom_data" does not exist)
-- UPDATE public.user_profiles 
-- SET rut = custom_data->>'rut' 
-- WHERE rut IS NULL AND custom_data->>'rut' IS NOT NULL;
