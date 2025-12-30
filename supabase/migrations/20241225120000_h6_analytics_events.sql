-- Hito 6: Analytics, Events & Hardening
-- Fixed: Removed hard dependency on validation_events not existing.
-- We ensure tables exist first.

-- 1. System Events Table
CREATE TABLE IF NOT EXISTS public.system_events (
    id uuid primary key default gen_random_uuid(),
    event_type text not null, -- 'ticket_resolved', 'content_published', 'validation_recorded'
    description text,
    related_entity_table text,
    related_entity_id uuid,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
-- Policies
DO $$ BEGIN
    CREATE POLICY "Allow read auth" ON public.system_events FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
    CREATE POLICY "Allow all service" ON public.system_events FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Dashboard Stats RPC
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb AS $$
DECLARE
    total_socios int;
    verified_socios int;
    pending_socios int;
    
    total_tickets int;
    resolved_tickets int;
    
    validation_stats jsonb;
BEGIN
    -- Socio Stats
    SELECT count(*) INTO total_socios FROM public.socios;
    SELECT count(*) INTO verified_socios FROM public.socios WHERE status = 'verified';
    SELECT count(*) INTO pending_socios FROM public.socios WHERE status = 'pending';
    
    -- Ticket Stats (Last 30 days)
    SELECT count(*) INTO total_tickets FROM public.tickets WHERE created_at > (now() - interval '30 days');
    SELECT count(*) INTO resolved_tickets FROM public.tickets WHERE status = 'resolved' AND created_at > (now() - interval '30 days');
    
    -- Validation Stats (Simple aggregation for now)
    -- Group by result (Approved/Rejected)
    SELECT jsonb_agg(t) INTO validation_stats FROM (
        SELECT result, count(*) as count 
        FROM public.validation_events 
        GROUP BY result
    ) t;

    RETURN jsonb_build_object(
        'socios', jsonb_build_object(
            'total', total_socios,
            'verified', verified_socios,
            'pending', pending_socios
        ),
        'tickets', jsonb_build_object(
            'total_30d', total_tickets,
            'resolved_30d', resolved_tickets
        ),
        'validations', validation_stats
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Cleanup Function
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Soft delete / Archive logic (simplified for MVP: just Delete very old logs)
    -- Deleting system events older than 36 months
    DELETE FROM public.system_events WHERE created_at < (now() - interval '36 months');
    
    -- Deleting old validation logs older than 36 months
    DELETE FROM public.validation_events WHERE created_at < (now() - interval '36 months');
    
    -- We generally DONT delete Tickets or User data unless explicitly requested/anonymized.
END;
$$ LANGUAGE plpgsql;

-- 4. Triggers for System Events

-- Trigger: Ticket Resolved
CREATE OR REPLACE FUNCTION public.trigger_log_ticket_resolved()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'resolved') THEN
        INSERT INTO public.system_events (event_type, description, related_entity_table, related_entity_id, metadata)
        VALUES ('ticket_resolved', 'Ticket marked as resolved', 'tickets', NEW.id, jsonb_build_object('ticket_number', NEW.ticket_number));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ticket_resolved ON public.tickets;
CREATE TRIGGER trg_ticket_resolved
    AFTER UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_log_ticket_resolved();

-- Trigger: Content Published
CREATE OR REPLACE FUNCTION public.trigger_log_content_published()
RETURNS TRIGGER AS $$
BEGIN
    -- status change to 'publicado'
    IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'publicado') THEN
        INSERT INTO public.system_events (event_type, description, related_entity_table, related_entity_id, metadata)
        VALUES ('content_published', 'Content item published', 'content_items', NEW.id, jsonb_build_object('title', NEW.title));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_published ON public.content_items;
CREATE TRIGGER trg_content_published
    AFTER UPDATE ON public.content_items
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_log_content_published();

-- Trigger: Validation Recorded
CREATE OR REPLACE FUNCTION public.trigger_log_validation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.system_events (event_type, description, related_entity_table, related_entity_id, metadata)
    VALUES ('validation_recorded', 'Benefit validation event', 'validation_events', NEW.id, jsonb_build_object('method', NEW.method, 'result', NEW.result));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validation_recorded ON public.validation_events;
CREATE TRIGGER trg_validation_recorded
    AFTER INSERT ON public.validation_events
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_log_validation();
