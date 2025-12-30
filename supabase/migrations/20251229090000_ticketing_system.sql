-- Create Ticket Categories Table
CREATE TABLE IF NOT EXISTS public.ticket_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL, -- Simplified: categories belong to tenant
    name TEXT NOT NULL,
    sla_hours_response INTEGER DEFAULT 24,
    sla_hours_resolution INTEGER DEFAULT 72,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- The socio/user who owns the ticket
    category_id UUID REFERENCES public.ticket_categories(id),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('new', 'open', 'waiting_user', 'resolved', 'closed')) DEFAULT 'new',
    subject TEXT NOT NULL,
    
    -- SLA Fields
    sla_deadline TIMESTAMPTZ, -- Calculated creation_time + sla_hours_resolution
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Ticket Messages Table
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- Sender
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- For agent notes
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Support Macros Table
CREATE TABLE IF NOT EXISTS public.support_macros (
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

-- Helper function for RLS (Reuse existing if available or create)
-- We'll assume the standard tenant check pattern:
-- (tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()))

-- Policies: Ticket Categories
CREATE POLICY "Tenant Users view categories" ON public.ticket_categories
FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Admins manage categories" ON public.ticket_categories
FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin') -- Assuming roles exist in profile or we check generic admin logic
    )
);

-- Policies: Tickets
-- 1. Admins/Agents see ALL tickets for tenant
CREATE POLICY "Admins view all tenant tickets" ON public.tickets
FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
    -- Add role check if we want to separate standard users from admins clearly. 
    -- For now, let's say anyone with 'admin' role sees all.
    AND (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin'))
        OR
        user_id = auth.uid() -- Or user sees their own
    )
);

-- Actually, simpler logic:
-- Users see their own tickets.
CREATE POLICY "Users view own tickets" ON public.tickets
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users create tickets" ON public.tickets
FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
);

-- Admins see all tickets in tenant
CREATE POLICY "Admins manage all tickets" ON public.tickets
FOR ALL USING (
   tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
   AND (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);


-- Policies: Messages
-- Users see messages on their tickets
CREATE POLICY "Users view messages on own tickets" ON public.ticket_messages
FOR SELECT USING (
    ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid())
    AND is_internal = false -- Users don't see internal notes
);

CREATE POLICY "Users send messages on own tickets" ON public.ticket_messages
FOR INSERT WITH CHECK (
    ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid())
);

-- Admins manage messages
CREATE POLICY "Admins manage messages" ON public.ticket_messages
FOR ALL USING (
    ticket_id IN (
        SELECT id FROM public.tickets 
        WHERE tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- Policies: Macros
CREATE POLICY "Admins manage macros" ON public.support_macros
FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
);

-- Indexes
CREATE INDEX idx_tickets_tenant ON public.tickets(tenant_id);
CREATE INDEX idx_tickets_user ON public.tickets(user_id);
CREATE INDEX idx_ticket_messages_ticket ON public.ticket_messages(ticket_id);
