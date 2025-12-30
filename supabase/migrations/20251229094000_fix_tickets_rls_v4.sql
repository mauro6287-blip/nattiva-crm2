-- Usamos V4 para evitar conflictos de ownership
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id_v4()
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1; $$;

GRANT EXECUTE ON FUNCTION public.get_auth_tenant_id_v4 TO postgres, authenticated, service_role;

-- Aplicar seguridad a TICKETS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Politica_Unica_Tickets" ON public.tickets;
DROP POLICY IF EXISTS "Politica_Unica_Tickets_V4" ON public.tickets;

CREATE POLICY "Politica_Unica_Tickets_V4" ON public.tickets
FOR ALL
USING ( tenant_id = get_auth_tenant_id_v4() )
WITH CHECK ( tenant_id = get_auth_tenant_id_v4() );

-- Aplicar seguridad a MENSAJES
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Politica_Unica_Mensajes" ON public.ticket_messages;
DROP POLICY IF EXISTS "Politica_Unica_Mensajes_V4" ON public.ticket_messages;

CREATE POLICY "Politica_Unica_Mensajes_V4" ON public.ticket_messages
FOR ALL
USING ( ticket_id IN (SELECT id FROM tickets) )
WITH CHECK ( ticket_id IN (SELECT id FROM tickets) );

-- Asegurar permisos
GRANT ALL ON public.tickets TO postgres, authenticated, service_role;
GRANT ALL ON public.ticket_messages TO postgres, authenticated, service_role;
GRANT ALL ON public.ticket_categories TO postgres, authenticated, service_role;
GRANT ALL ON public.support_macros TO postgres, authenticated, service_role;
