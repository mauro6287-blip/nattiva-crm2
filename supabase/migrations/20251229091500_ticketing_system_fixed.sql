BEGIN;

-- Cleanup (just in case)
DROP TABLE IF EXISTS public.ticket_messages CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.ticket_categories CASCADE;
DROP TABLE IF EXISTS public.support_macros CASCADE;

-- Create Ticket Categories Table
CREATE TABLE public.ticket_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL, 
    name TEXT NOT NULL,
    sla_hours_response INTEGER DEFAULT 24,
    sla_hours_resolution INTEGER DEFAULT 72,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Tickets Table
CREATE TABLE public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- The socio/user who owns the ticket
    category_id UUID REFERENCES public.ticket_categories(id),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('new', 'open', 'waiting_user', 'resolved', 'closed')) DEFAULT 'new',
    subject TEXT NOT NULL,
    
    -- SLA Fields
    sla_deadline TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Ticket Messages Table
CREATE TABLE public.ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Support Macros Table
CREATE TABLE public.support_macros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_macros ENABLE ROW LEVEL SECURITY;

-- Helper Function (using the one we fixed in 20251229081800_emergency_fix_recursion_v2.sql)
-- get_auth_tenant_id_v2()

-- Policies: Ticket Categories
CREATE POLICY "Tenant Users view categories" ON public.ticket_categories
FOR SELECT USING (tenant_id = get_auth_tenant_id_v2());

CREATE POLICY "Tenant Admins manage categories" ON public.ticket_categories
FOR ALL USING (tenant_id = get_auth_tenant_id_v2());

-- Policies: Tickets
-- 1. Users see their own tickets
CREATE POLICY "Users view own tickets" ON public.tickets
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users create tickets" ON public.tickets
FOR INSERT WITH CHECK (
    tenant_id = get_auth_tenant_id_v2()
    AND user_id = auth.uid()
);

-- 2. Tenant Staff (Admins/Support) see ALL tickets
-- For now, giving full visibility to anyone in the tenant (MVP)
CREATE POLICY "Tenant Staff view all tickets" ON public.tickets
FOR SELECT USING (tenant_id = get_auth_tenant_id_v2());

CREATE POLICY "Tenant Staff manage all tickets" ON public.tickets
FOR UPDATE USING (tenant_id = get_auth_tenant_id_v2());

-- Policies: Messages
-- Users see messages on their tickets
CREATE POLICY "Users view messages on own tickets" ON public.ticket_messages
FOR SELECT USING (
    ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid())
    AND is_internal = false 
);

CREATE POLICY "Users send messages on own tickets" ON public.ticket_messages
FOR INSERT WITH CHECK (
    ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid())
);

-- Tenant Staff see all messages
CREATE POLICY "Staff view all messages" ON public.ticket_messages
FOR SELECT USING (
    ticket_id IN (SELECT id FROM public.tickets WHERE tenant_id = get_auth_tenant_id_v2())
);

CREATE POLICY "Staff send messages" ON public.ticket_messages
FOR INSERT WITH CHECK (
    ticket_id IN (SELECT id FROM public.tickets WHERE tenant_id = get_auth_tenant_id_v2())
);

-- Policies: Macros
CREATE POLICY "Staff manage macros" ON public.support_macros
FOR ALL USING (tenant_id = get_auth_tenant_id_v2());

-- Indexes
CREATE INDEX idx_tickets_tenant ON public.tickets(tenant_id);
CREATE INDEX idx_tickets_user ON public.tickets(user_id);
CREATE INDEX idx_ticket_messages_ticket ON public.ticket_messages(ticket_id);

COMMIT;
