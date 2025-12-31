import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { Database } from '@/types_db'

export async function createClient() {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('Faltan las variables de entorno de Supabase. Verifica tu archivo .env o la configuración en Hostinger.')
    }

    const normalizedUrl = supabaseUrl?.replace(/\/$/, '') || ''

    return createServerClient<Database>(
        normalizedUrl,
        supabaseKey!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
