import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

// Lightweight Silent Sync Endpoint
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, goodbarber_user_id, name } = body

        // Fast Fail: minimal validation
        if (!email || !goodbarber_user_id) {
            return NextResponse.json({ success: false, error: 'missing_fields' }, { status: 400 })
        }

        const supabaseAdmin = createAdminClient()
        if (!supabaseAdmin) {
            return NextResponse.json({ success: false, error: 'Config Error' }, { status: 503 })
        }

        // 1. Resolve Tenant (Cacheable in real-world, here usually fast enough)
        // Optimization: In a real multi-tenant app, the app should send a tenant_slug or API key.
        // For this MVP, we grab the first active tenant.
        const { data: tenant } = await (supabaseAdmin
            .from('tenants') as any)
            .select('id')
            .limit(1)
            .single()

        if (!tenant) return NextResponse.json({ success: false }, { status: 500 })

        // 2. Fire-and-forget Update (await it to ensure completion but don't hold connection long)
        // We match by Email + Tenant
        const { error } = await (supabaseAdmin
            .from('user_profiles') as any)
            .update({
                goodbarber_app_id: goodbarber_user_id,
                // optionally update name if provided and missing?
                // Let's stick to just the ID sync to be safe/minimal side effects.
            })
            .eq('tenant_id', tenant.id)
            .ilike('email', email)

        // We don't care if row didn't exist (no match), that's fine. 
        // We only care that if it DID exist, it updated.
        // We intentionally suppress detailed errors for this silent endpoint.

        return NextResponse.json({ success: true })

    } catch (e) {
        // Silent fail
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
