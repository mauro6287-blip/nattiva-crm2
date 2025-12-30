-- Hito 5: Ticketing System Updates

-- 0. Ensure Enums exist
DO $$ BEGIN
    CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Ensure tables exist (safeguard against partial migrations)
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  subject text not null,
  status public.ticket_status default 'open',
  priority text default 'normal', -- will be altered below
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete set null,
  body text,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- 2. Update tickets table updates (columns)
ALTER TABLE public.tickets
    ADD COLUMN IF NOT EXISTS ticket_number SERIAL,
    ADD COLUMN IF NOT EXISTS user_name text,
    ADD COLUMN IF NOT EXISTS user_email text;

-- Handle priority conversion safely
DO $$ DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'priority';

    -- If it is text, convert to enum. If it is already enum, do nothing.
    IF col_type = 'text' OR col_type = 'character varying' THEN
        -- Check if values are compatible or reset them. To be safe, we can cast or update null.
        -- Assuming 'normal' -> 'medium' if we want mapping, but here we just cast.
        -- 'normal' is NOT in 'low, medium, high'. So cast will fail?
        -- We should update 'normal' to 'medium' first.
        UPDATE public.tickets SET priority = 'medium' WHERE priority = 'normal';
        
        ALTER TABLE public.tickets ALTER COLUMN priority DROP DEFAULT;
        ALTER TABLE public.tickets ALTER COLUMN priority TYPE public.ticket_priority USING priority::public.ticket_priority;
        ALTER TABLE public.tickets ALTER COLUMN priority SET DEFAULT 'medium';
    END IF;
END $$;

-- 3. Update ticket_messages table
ALTER TABLE public.ticket_messages
    ADD COLUMN IF NOT EXISTS sender_type text CHECK (sender_type IN ('user', 'admin')) DEFAULT 'user';

-- 4. Create ticket_status_history
CREATE TABLE IF NOT EXISTS public.ticket_status_history (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid references public.tickets(id) on delete cascade not null,
    changed_by uuid references auth.users(id) on delete set null,
    old_status public.ticket_status,
    new_status public.ticket_status,
    changed_at timestamptz default now()
);

ALTER TABLE public.ticket_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.ticket_status_history FOR ALL USING (true) WITH CHECK (true);

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON public.tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_user_email ON public.tickets(user_email);

-- 6. Trigger to auto-log status changes
CREATE OR REPLACE FUNCTION public.log_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.ticket_status_history (ticket_id, changed_by, old_status, new_status)
        VALUES (NEW.id, auth.uid(), OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_ticket_status_change ON public.tickets;
CREATE TRIGGER trigger_log_ticket_status_change
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE PROCEDURE public.log_ticket_status_change();
