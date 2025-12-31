import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'
import { Logger } from '@/utils/logger'

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}

export async function POST(request: Request) {
    const startTime = Date.now()
    const requestId = `req_${Math.random().toString(36).substr(2, 9)}`

    // Create Service Role Client (Bypasses RLS)
    const supabaseAdmin = createAdminClient()
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Config Error: Admin Client Missing' }, { status: 503 })
    }

    try {
        const body = await request.json()
        const { name, email, comment, goodbarber_user_id } = body

        Logger.log('INFO', 'WEBHOOK_RECEIVED', {
            request_id: requestId,
            metadata: { endpoint: 'create-ticket', has_gb_id: !!goodbarber_user_id, email: email } // Log email for debug
        })

        if (!comment) return NextResponse.json({ error: 'Comment required' }, { status: 400 })

        // 1. Resolve Tenant
        const { data: tenant, error: tenantError } = await (supabaseAdmin.from('tenants') as any).select('id').limit(1).single()
        if (tenantError || !tenant) {
            return NextResponse.json({ error: 'Config Error' }, { status: 500 })
        }

        let userId: string | null = null
        let autoLinked = false

        // 2. Auto-Link Logic (Explicit Update on User Profiles)
        if (goodbarber_user_id && email) {
            // Look for user by email using Admin Client
            const { data: user } = await (supabaseAdmin
                .from('user_profiles') as any)
                .select('id, goodbarber_app_id')
                .eq('tenant_id', tenant.id)
                .ilike('email', email)
                .single()

            if (user) {
                userId = user.id

                // If ID is missing or different, update it
                if (user.goodbarber_app_id !== goodbarber_user_id) {
                    const { error: updateError } = await (supabaseAdmin
                        .from('user_profiles') as any)
                        .update({ goodbarber_app_id: goodbarber_user_id })
                        .eq('id', user.id)

                    if (updateError) {
                        Logger.log('ERROR', 'AUTO_LINK_FAILED', { request_id: requestId, metadata: { error: updateError } })
                    } else {
                        autoLinked = true
                        Logger.log('INFO', 'USER_AUTO_LINKED', { request_id: requestId, metadata: { user_id: userId, gb_id: goodbarber_user_id } })

                        // Also maintain the map table for redundancy/history if we want, but User requested user_profiles update.
                        // I will implicitly update map table too if I want to be safe, but sticking to prompt instructions:
                        // "Explicit Update: ... update user_profiles"
                    }
                } else {
                    Logger.log('INFO', 'USER_ALREADY_LINKED', { request_id: requestId, metadata: { user_id: userId } })
                }
            }
        }

        // 3. Create Ticket
        const { data: ticket, error: ticketError } = await (supabaseAdmin
            .from('tickets') as any)
            .insert({
                tenant_id: tenant.id,
                subject: `Soporte App: ${name || email}`,
                user_name: name,
                user_email: email,
                status: 'open',
                priority: 'medium',
                created_by: userId,
                assigned_to: null
            })
            .select()
            .single()

        if (ticketError) {
            Logger.log('ERROR', 'TICKET_FAIL', { request_id: requestId, metadata: { error: ticketError } })
            return NextResponse.json({ error: 'Ticket Failed' }, { status: 500 })
        }

        // 4. Message
        const messageBody = comment + (goodbarber_user_id && !userId ? `\n\n[Unlinked GB ID: ${goodbarber_user_id}]` : '')
        await (supabaseAdmin.from('ticket_messages') as any).insert({
            tenant_id: tenant.id,
            ticket_id: ticket.id,
            sender_type: 'user',
            body: messageBody,
            author_id: userId
        })

        Logger.log('INFO', 'TICKET_CREATED_FIXED', { request_id: requestId, duration_ms: Date.now() - startTime })

        return NextResponse.json({ success: true, ticket_number: ticket.ticket_number })

    } catch (e: any) {
        Logger.log('CRITICAL', 'WEBHOOK_EXCEPTION', { request_id: requestId, metadata: { error: e.message } })
        return NextResponse.json({ error: 'Server Error' }, { status: 500 })
    }
}
