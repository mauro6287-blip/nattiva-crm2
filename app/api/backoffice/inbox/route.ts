import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const supabase = createAdminClient()
    if (!supabase) {
        return NextResponse.json({ tasks: [], error: 'Configuration Error: Admin Client missing' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    // We could extract tenant_id from headers/auth, but for MVP admin client sees all or filtered by user tenant if we pass it.
    // Assuming the user calling this is an Admin and we want their tenant's tasks.
    // But this involves "User Context" which createAdminClient ignores. 
    // Ideally we use createClient() (authenticated) but RLS handles filtering.
    // Let's use generic query but filter by the user's tenant if known.
    // For this prototype, we'll fetch ALL 'open' items for the active tenant context.

    // Hardcoded Tenant for MVP dev (or fetch from params)
    // @ts-ignore
    const tenantIdRes = await (supabase.from('tenants') as any).select('id').limit(1).single()
    const tenantId = tenantIdRes.data?.id

    if (!tenantId) return NextResponse.json({ tasks: [] })

    const tasks: any[] = []

    // 1. Tickets (Open)
    const { data: tickets } = await (supabase
        .from('tickets') as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'open')
        .order('created_at', { ascending: true })

    tickets?.forEach((t: any) => {
        tasks.push({
            id: t.id,
            type: 'ticket',
            priority: t.priority === 'high' ? 'High' : 'Normal',
            title: t.subject,
            user: t.user_name || t.user_email || 'Anonymous',
            waiting_since: t.created_at,
            status: t.status,
            metadata: { original: t }
        })
    })

    // 2. Validation Issues (Rejected/Ambiguous)
    const { data: validations } = await (supabase
        .from('validation_events') as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .in('result', ['rejected', 'ambiguous'])
        .order('created_at', { ascending: true })

    validations?.forEach((v: any) => {
        tasks.push({
            id: v.id,
            type: 'validation',
            priority: 'High', // Security/Access issues are high priority
            title: `Validation ${v.result}: ${v.method.toUpperCase()}`,
            user: v.payload?.user_name || 'Unknown User',
            waiting_since: v.created_at,
            status: v.result,
            metadata: { original: v }
        })
    })

    // 3. Content Pending (Status = enviado)
    const { data: content } = await (supabase
        .from('content_items') as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'enviado')
        .order('created_at', { ascending: true })

    content?.forEach((c: any) => {
        tasks.push({
            id: c.id,
            type: 'content',
            priority: 'Normal',
            title: `Content Review: ${c.title}`,
            user: c.author_name || 'Unknown Author',
            waiting_since: c.created_at,
            status: 'pending_approval',
            metadata: { original: c }
        })
    })

    // Sort by Waiting Time (Oldest first)
    tasks.sort((a, b) => new Date(a.waiting_since).getTime() - new Date(b.waiting_since).getTime())

    return NextResponse.json({ tasks })
}
