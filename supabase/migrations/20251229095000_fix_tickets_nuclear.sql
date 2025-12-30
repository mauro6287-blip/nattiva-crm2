-- Asegurar función maestra (V3 requested by user)
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id_v3()
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1; $$;

-- 1. TICKETS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Nuclear Option: Drop ALL policies for tickets
DO $$ 
BEGIN 
    EXECUTE (
        SELECT string_agg('DROP POLICY "' || policyname || '" ON public.tickets;', '') 
        FROM pg_policies 
        WHERE tablename = 'tickets'
    ); 
EXCEPTION WHEN OTHERS THEN 
    NULL; 
END $$;

CREATE POLICY "Politica_Unica_Tickets" ON public.tickets
FOR ALL USING ( tenant_id = get_auth_tenant_id_v3() )
WITH CHECK ( tenant_id = get_auth_tenant_id_v3() );

-- 2. MENSAJES
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Nuclear Option: Drop ALL policies for ticket_messages
DO $$ 
BEGIN 
    EXECUTE (
        SELECT string_agg('DROP POLICY "' || policyname || '" ON public.ticket_messages;', '') 
        FROM pg_policies 
        WHERE tablename = 'ticket_messages'
    ); 
EXCEPTION WHEN OTHERS THEN 
    NULL; 
END $$;

CREATE POLICY "Politica_Unica_Mensajes" ON public.ticket_messages
FOR ALL USING ( ticket_id IN (SELECT id FROM tickets) )
WITH CHECK ( ticket_id IN (SELECT id FROM tickets) );

-- Grant permissions just in case
GRANT ALL ON public.tickets TO postgres, authenticated, service_role;
GRANT ALL ON public.ticket_messages TO postgres, authenticated, service_role;
