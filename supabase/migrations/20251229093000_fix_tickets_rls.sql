-- Usamos la función segura que ya creamos en el Hito 13
-- (Si no existe, el script la crea de nuevo por seguridad)
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id_v3()
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1; $$;

-- Aplicar seguridad a TICKETS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Tickets" ON public.tickets;
DROP POLICY IF EXISTS "Politica_Unica_Tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Tenant Staff view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Tenant Staff manage all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins view all tenant tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins manage all tickets" ON public.tickets;

CREATE POLICY "Politica_Unica_Tickets" ON public.tickets
FOR ALL
USING ( tenant_id = get_auth_tenant_id_v3() )
WITH CHECK ( tenant_id = get_auth_tenant_id_v3() );

-- Aplicar seguridad a MENSAJES
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Politica_Unica_Mensajes" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users view messages on own tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users send messages on own tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Staff view all messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Staff send messages" ON public.ticket_messages;

CREATE POLICY "Politica_Unica_Mensajes" ON public.ticket_messages
FOR ALL
USING ( ticket_id IN (SELECT id FROM tickets) )
WITH CHECK ( ticket_id IN (SELECT id FROM tickets) );
