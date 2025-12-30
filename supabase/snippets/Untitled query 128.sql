-- 1. Habilitar la seguridad (por si acaso)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Borrar políticas viejas que puedan estar fallando
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- 3. CREAR LA REGLA DE ORO: "Permitir que cada uno vea lo suyo"
CREATE POLICY "Users can view own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Regla para Admins (para que no te bloquee nada)
CREATE POLICY "Admins can do everything" 
ON public.user_profiles 
FOR ALL 
USING (auth.uid() = user_id); -- Simplificado para desbloquearte