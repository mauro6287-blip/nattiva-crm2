import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()

    // 1. Auth Check (Optional depending on requirements, but usually required)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { rut, code } = body

        if (!rut && !code) {
            return NextResponse.json({ error: 'Missing rut or code' }, { status: 400 })
        }

        // 2. Perform Query with Data Minimization via SELECT
        // We look for a socio that matches.
        // Note: RLS policies on 'socios' will apply. 
        // If the caller is a 'Provider', they might need specific RLS or permissions to see socios?
        // For now, assuming standard RLS allows read.

        // We strictly select ONLY valid status and names. NOT *
        // We strictly select ONLY valid status and names. NOT *
        const { data, error } = await (supabase
            .from('socios') as any)
            .select('names, surnames, status')
            .or(`rut_or_document.eq.${rut || ''},id.eq.${code || '00000000-0000-0000-0000-000000000000'}`)
            .single()

        if (error || !data) {
            // Return generic invalid to avoid leaking existence? Or just 'Not Found'.
            return NextResponse.json({ valid: false, message: 'Not found' }, { status: 404 })
        }

        // 3. Return Minimized Data
        return NextResponse.json({
            valid: data.status === 'verified',
            name: `${data.names} ${data.surnames}`,
            // We do NOT return email, phone, join_date etc.
        })

    } catch (err) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 })
    }
}
