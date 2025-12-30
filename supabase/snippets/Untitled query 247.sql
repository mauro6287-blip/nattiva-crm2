-- Crear la relación oficial entre Perfiles y Sindicatos
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_tenant_id_fkey;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_tenant_id_fkey 
FOREIGN KEY (tenant_id) 
REFERENCES public.tenants (id);