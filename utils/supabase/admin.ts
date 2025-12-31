import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types_db'

/**
 * Creates a Supabase Admin Client with the Service Role Key.
 * THIS FUNCTION MUST ONLY BE CALLED ON THE SERVER.
 * 
 * Safety:
 * - Checks for process.env.SUPABASE_SERVICE_ROLE_KEY presence.
 * - Throws a descriptive error in Development.
 * - Returns null or throws a safe error in Production to prevent crashes.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Validation Logic
    if (!supabaseUrl || !serviceRoleKey) {
        if (process.env.NODE_ENV === 'development') {
            throw new Error(
                '❌ FATAL: Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in local development. Check your .env.local file.'
            )
        } else {
            // In Production, we log specifically but throw a generic error to the caller
            // to avoid revealing sensitive info, but also prevent crash loops.
            console.error('🚨 [AdminClient] Failed to initialize: Missing Environment Variables.')
            // Throw so the specific Server Action catches it.
            throw new Error('Error de configuración del servidor (Admin Key Missing).')
        }
    }

    return createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
