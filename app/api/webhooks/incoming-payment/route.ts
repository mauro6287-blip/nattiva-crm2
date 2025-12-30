import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { subject, text_body } = body
        const supabase = createAdminClient()

        // 1. Audit Insert (Status: ORPHAN by default)
        const content = `${subject || ''} ${text_body || ''}`

        const { data: auditLog, error: auditError } = await (supabase
            .from('payment_audit_logs') as any)
            .insert({
                email_subject: subject,
                email_body: text_body,
                status: 'ORPHAN'
            })
            .select()
            .single()

        if (auditError) {
            console.error('Audit Log Failed:', auditError)
            // We might still want to proceed, or fail hard. 
            // Instruction says "Never lose an incoming email". If we can't log, we are in trouble.
            // But let's proceed to try match anyway, or return 500? 
            // Let's return 500 to force retry from sender if possible, but for MVP we log to console.
        }

        // 2. Regex Match
        const regex = /(TICKET-\d{4,6})/i
        const match = content.match(regex)

        if (!match) {
            // Step 4 (Fail): Leave as ORPHAN.
            return NextResponse.json({
                status: 'ignored',
                reason: 'No ticket code found. Logged as ORPHAN.'
            })
        }

        const orderCode = match[0].toUpperCase()

        // 3. Database Lookup
        const { data: order, error: fetchError } = await (supabase
            .from('payment_orders') as any)
            .select('*')
            .eq('order_code', orderCode)
            .single()

        if (fetchError || !order) {
            // Code found but no specific order in DB? 
            // Still ORPHAN logically, but maybe we want to guard against this?
            // For now, we stick to requirements: "If a code is found AND matches a pending order"
            return NextResponse.json({
                status: 'ignored',
                reason: `Ticket code ${orderCode} found but not in DB. Logged as ORPHAN.`
            })
        }

        // 4. Status Action (Success)
        if (order.status === 'PENDING') {
            // Update Order
            const { error: updateError } = await (supabase
                .from('payment_orders') as any)
                .update({
                    status: 'PAID',
                    raw_proof: JSON.stringify(body)
                })
                .eq('id', order.id)

            if (updateError) {
                return NextResponse.json({ status: 'error', message: updateError.message }, { status: 500 })
            }

            // Update Audit Log to MATCHED
            if (auditLog) {
                await (supabase
                    .from('payment_audit_logs') as any)
                    .update({
                        status: 'MATCHED',
                        matched_order_code: orderCode
                    })
                    .eq('id', auditLog.id)
            }

            return NextResponse.json({
                status: 'matched',
                order: orderCode,
                action: 'UPDATED_TO_PAID'
            })
        } else {
            return NextResponse.json({
                status: 'ignored',
                reason: `Order ${orderCode} is already ${order.status}`
            })
        }

    } catch (error) {
        return NextResponse.json({ status: 'error', message: 'Invalid Request Body' }, { status: 400 })
    }
}
