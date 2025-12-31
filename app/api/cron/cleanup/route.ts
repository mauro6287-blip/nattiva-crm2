import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(req: NextRequest) {
    // 1. Security Check
    // In production, this should check for a secret authorization header (e.g., CRON_SECRET)
    // For MVP/Local, we will allow it but logging the attempt is good.
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
        return NextResponse.json({ error: 'Config Error: Admin Client Missing' }, { status: 503 })
    }

    try {
        // 2. Execute Cleanup RPC
        const { error } = await supabase.rpc('cleanup_old_data')

        if (error) throw error

        return NextResponse.json({ success: true, message: 'Cleanup job executed successfully.' })
    } catch (error: any) {
        console.error('Cleanup Job Failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
