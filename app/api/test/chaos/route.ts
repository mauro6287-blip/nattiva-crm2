import { NextResponse } from 'next/server'
import { Logger } from '@/utils/logger'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(request: Request) {
    const { type } = await request.json()
    const supabase = createAdminClient()
    if (!supabase) {
        return NextResponse.json({ error: 'Config Error' }, { status: 503 })
    }

    // Resolve a tenant for logging (just first one again)
    const { data: tenant } = await (supabase.from('tenants') as any).select('id').limit(1).single()

    if (!tenant || typeof tenant !== 'object' || !('id' in tenant)) {
        return NextResponse.json({ error: 'No tenant found for testing' }, { status: 404 })
    }
    const tenantId = tenant.id as string

    if (type === 'webhook_fail') {
        Logger.log('ERROR', 'CHAOS_WEBHOOK_FAILURE', {
            tenant_id: tenantId,
            request_id: 'chaos_req_500',
            metadata: { simulated: true, error: 'Database connection timeout' }
        })
    } else if (type === 'slow_request') {
        Logger.log('INFO', 'CHAOS_SLOW_QUERY', {
            tenant_id: tenantId,
            request_id: 'chaos_req_slow',
            duration_ms: 2500, // 2.5s
            metadata: { simulated: true, query: 'SELECT * FROM big_table' }
        })
    } else if (type === 'valid_login') {
        Logger.log('INFO', 'AUTH_LOGIN_SUCCESS', {
            tenant_id: tenantId,
            request_id: 'chaos_req_auth',
            metadata: { simulated: true, email: 'user@example.com' }
        })
    }

    return NextResponse.json({ success: true })
}
