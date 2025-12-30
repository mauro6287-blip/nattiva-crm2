import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Secure User Search
export async function GET(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!query || query.length < 3) {
        return NextResponse.json({ error: 'Query too short' }, { status: 400 })
    }

    // 2. Perform Query with Data Minimization
    // Searching user_profiles or socios? Prompt says "user/search".
    // Let's assume user_profiles (e.g. for assigning tickets).
    const { data, error } = await (supabase
        .from('user_profiles') as any)
        .select('id, full_name, email') // Minimal fields
        .ilike('full_name', `%${query}%`)
        .limit(10) // Limit results

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: data })
}
