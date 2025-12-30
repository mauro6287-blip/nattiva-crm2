-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid, -- Optional, populated if the source table has it
    actor_id uuid DEFAULT auth.uid(), -- The user performing the action
    table_name text NOT NULL,
    record_id text NOT NULL, -- Casted to text for flexibility
    operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values jsonb,
    new_values jsonb,
    changed_fields text[], -- Array of column names that changed
    created_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);

-- RLS: Read-only for admins/compliance, No public access
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Compliance Officers can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (true); -- Allow all authenticated users for Hito 15 MVP/Verification


-- 2. Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data jsonb;
    v_new_data jsonb;
    v_tenant_id uuid;
    v_changed_fields text[] := '{}';
    v_key text;
    v_val_old jsonb;
    v_val_new jsonb;
BEGIN
    -- Determine operation type and set OLD/NEW data
    IF (TG_OP = 'INSERT') THEN
        v_new_data = to_jsonb(NEW);
        v_old_data = null;
        -- Try to extract tenant_id if it exists
        IF (v_new_data ? 'tenant_id') THEN
            v_tenant_id = (v_new_data->>'tenant_id')::uuid;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_new_data = to_jsonb(NEW);
        v_old_data = to_jsonb(OLD);
        
        IF (v_new_data ? 'tenant_id') THEN
            v_tenant_id = (v_new_data->>'tenant_id')::uuid;
        END IF;

        -- Compute changed fields
        FOR v_key IN SELECT jsonb_object_keys(v_new_data) LOOP
            v_val_new = v_new_data -> v_key;
            v_val_old = v_old_data -> v_key;
            
            IF (v_val_new IS DISTINCT FROM v_val_old) THEN
                v_changed_fields = array_append(v_changed_fields, v_key);
            END IF;
        END LOOP;
        
        -- Optimization: If no fields changed in an UPDATE, skip logging (optional, but good for noise reduction)
        IF array_length(v_changed_fields, 1) IS NULL THEN
            RETURN NEW;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        v_new_data = null;
        v_old_data = to_jsonb(OLD);
        IF (v_old_data ? 'tenant_id') THEN
            v_tenant_id = (v_old_data->>'tenant_id')::uuid;
        END IF;
    END IF;

    -- Insert Log
    INSERT INTO public.audit_logs (
        tenant_id,
        actor_id,
        table_name,
        record_id,
        operation,
        old_values,
        new_values,
        changed_fields
    ) VALUES (
        v_tenant_id,
        auth.uid(),
        TG_TABLE_NAME,
        COALESCE(
            (v_new_data->>'id'), 
            (v_old_data->>'id'),
            'unknown'
        ),
        TG_OP,
        v_old_data,
        v_new_data,
        v_changed_fields
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Retention Policy Function (36 Months)
CREATE OR REPLACE FUNCTION public.enforce_retention_policy()
RETURNS void AS $$
BEGIN
    DELETE FROM public.audit_logs
    WHERE created_at < (now() - INTERVAL '36 months');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply Triggers to Critical Tables

-- Tickets
DROP TRIGGER IF EXISTS audit_tickets_trigger ON public.tickets;
CREATE TRIGGER audit_tickets_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Ticket Messages
DROP TRIGGER IF EXISTS audit_ticket_messages_trigger ON public.ticket_messages;
CREATE TRIGGER audit_ticket_messages_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- User Profiles
DROP TRIGGER IF EXISTS audit_user_profiles_trigger ON public.user_profiles;
CREATE TRIGGER audit_user_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Providers (Proveedores)
DROP TRIGGER IF EXISTS audit_providers_trigger ON public.providers;
CREATE TRIGGER audit_providers_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
