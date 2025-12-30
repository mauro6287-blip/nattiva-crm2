'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createTicket(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get Tenant context
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile || !('tenant_id' in (profile as any))) return { error: 'No tenant found' }
    const tenantId = (profile as any).tenant_id as string

    const subject = formData.get('subject') as string
    const categoryId = formData.get('category_id') as string
    const initialMessage = formData.get('message') as string
    const priority = formData.get('priority') as string || 'medium'

    if (!subject || !categoryId || !initialMessage) {
        return { error: 'Missing required fields' }
    }

    // 1. Get Category SLA to calculate deadline
    const { data: category } = await (supabase
        .from('ticket_categories') as any)
        .select('sla_hours_resolution')
        .eq('id', categoryId)
        .single()

    if (!category) return { error: 'Invalid category' }

    const slaHours = category.sla_hours_resolution || 72
    const deadline = new Date()
    deadline.setHours(deadline.getHours() + slaHours)

    // 2. Create Ticket
    const { data: ticket, error: ticketError } = await (supabase
        .from('tickets') as any)
        .insert({
            tenant_id: tenantId,
            user_id: user.id,
            category_id: categoryId,
            priority,
            subject,
            status: 'new',
            sla_deadline: deadline.toISOString()
        })
        .select('id')
        .single()

    if (ticketError) {
        console.error('Create Ticket Error:', ticketError)
        return { error: `DB Error (${ticketError.code}): ${ticketError.message}` }
    }

    // 3. Create Initial Message
    const { error: msgError } = await (supabase
        .from('ticket_messages') as any)
        .insert({
            ticket_id: ticket.id,
            user_id: user.id,
            content: initialMessage,
            is_internal: false
        })

    if (msgError) console.error('Initial Message Error:', msgError)

    revalidatePath('/dashboard/tickets')
    return { success: true, ticketId: ticket.id }
}

export async function getTickets(statusFilter?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('tickets')
        .select(`
            *,
            *,
            category:ticket_categories(name),
            user:user_id(email, full_name) -- Correct column name from schema
        `)
        .order('created_at', { ascending: false })

    if (statusFilter) {
        query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
        console.error('Fetch Tickets Error:', error)
        throw new Error(`DB Error (${error.code}): ${error.message}`)
    }
    return data
}

export async function getTicketDetails(ticketId: string) {
    const supabase = await createClient()

    // Fetch Ticket + Category + User
    const { data: ticket, error } = await (supabase
        .from('tickets') as any)
        .select(`
            *,
            category:ticket_categories(*)
        `)
        .eq('id', ticketId)
        .single()

    if (error || !ticket) return { error: 'Ticket not found' }

    // Fetch Messages (Ordered)
    const { data: messages } = await (supabase
        .from('ticket_messages') as any)
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

    return { ticket, messages: messages || [] }
}

export async function addMessage(ticketId: string, content: string, attachments: any[] = [], isInternal: boolean = false) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    if (!content.trim() && attachments.length === 0) return { error: 'Message cannot be empty' }

    const { error } = await (supabase
        .from('ticket_messages') as any)
        .insert({
            ticket_id: ticketId,
            user_id: user.id,
            content,
            attachments, // Save attachments array
            is_internal: isInternal
        })

    if (error) return { error: error.message }

    // 147 is original line number approx
    if (error) return { error: error.message }

    // Update ticket updated_at
    await (supabase.from('tickets') as any).update({ updated_at: new Date().toISOString() }).eq('id', ticketId)

    // NOTIFICATION ENGINE
    // Trigger only if message is from an agent (not the ticket owner)
    // We assume if the current user is NOT the ticket.user_id, it is an agent/admin
    try {
        const { data: ticket } = await (supabase.from('tickets') as any).select('user_id, subject').eq('id', ticketId).single()

        if (ticket && ticket.user_id !== user.id) {
            // Fetch Ticket Owner Profile
            const { data: ownerProfile } = await (supabase
                .from('user_profiles') as any)
                .select('email, full_name')
                .eq('id', ticket.user_id)
                .single()

            if (ownerProfile?.email) {
                const { sendTicketNotification } = await import('@/lib/notifications')

                // Get Agent Name (current user)
                const { data: agentProfile } = await (supabase.from('user_profiles') as any).select('full_name').eq('id', user.id).single()
                const agentName = agentProfile?.full_name || 'Agente de Soporte'

                await sendTicketNotification({
                    targetEmail: ownerProfile.email,
                    ticketTitle: ticket.subject,
                    messageContent: content,
                    agentName: agentName,
                    userId: ticket.user_id
                })

                return { success: true, notificationSent: true }
            }
        }
    } catch (notifyError) {
        console.error('Notification Error:', notifyError)
        // do not fail the action if notification fails
    }

    revalidatePath(`/dashboard/tickets/${ticketId}`)
    return { success: true }
}

export async function updateTicketStatus(ticketId: string, status: string) {
    const supabase = await createClient()

    const { error } = await (supabase
        .from('tickets') as any)
        .update({ status })
        .eq('id', ticketId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/tickets/${ticketId}`)
    revalidatePath('/dashboard/tickets')
    return { success: true }
}

export async function getMacros() {
    const supabase = await createClient()
    // Helper to get allowed macros (Assuming Admin role logic handled by RLS)
    const { data } = await (supabase.from('support_macros') as any).select('*').order('usage_count', { ascending: false })
    return data || []
}

export async function getCategories() {
    const supabase = await createClient()
    const { data } = await (supabase.from('ticket_categories') as any).select('*')
    return data || []
}

// Initial seeder for Categories & Macros
export async function seedDefaults() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile || !('tenant_id' in (profile as any))) return
    const tenantId = (profile as any).tenant_id as string

    // Seed Categories
    const { count: catCount } = await supabase.from('ticket_categories').select('*', { count: 'exact', head: true })
    if (catCount === 0) {
        await (supabase.from('ticket_categories') as any).insert([
            { tenant_id: tenantId, name: 'Soporte General', sla_hours_resolution: 48 },
            { tenant_id: tenantId, name: 'Pagos y Facturación', sla_hours_resolution: 24 },
            { tenant_id: tenantId, name: 'Problema Técnico', sla_hours_resolution: 72 }
        ])
    }

    // Seed Macros
    const { count: macroCount } = await supabase.from('support_macros').select('*', { count: 'exact', head: true })
    if (macroCount === 0) {
        await (supabase.from('support_macros') as any).insert([
            {
                tenant_id: tenantId,
                title: 'Saludo Inicial',
                content: 'Hola {{name}},\n\nGracias por contactarnos. Hemos recibido tu solicitud y la estamos revisando.\n\nSaludos,'
            },
            {
                tenant_id: tenantId,
                title: 'Solicitud de Más Info',
                content: 'Hola,\n\nPara poder ayudarte mejor, ¿podrías enviarnos una captura de pantalla del error?\n\nQuedamos atentos.'
            },
            {
                tenant_id: tenantId,
                title: 'Cierre de Ticket',
                content: 'Hola {{name}},\n\nConfirmamos que el incidente ha sido resuelto. Procederemos a cerrar este ticket.\n\nGracias por tu paciencia.'
            }
        ])
    }
}
