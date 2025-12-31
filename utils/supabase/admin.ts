import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types_db'

// Singleton instance
let adminClient: SupabaseClient<Database> | null = null;

/**
 * Retrieves the Supabase Admin Client safely.
 * Returns null if credentials are missing instead of throwing.
 * This prevents Server Components from crashing during render.
 */
export function getAdminClient(): SupabaseClient<Database> | null {
    // Return existing instance if available
    if (adminClient) return adminClient;

    // Hard Fallback for Hostinger Injection Failure
    const HARD_URL = 'https://pxfucuiqtktgwspvpffh.supabase.co'
    const HARD_KEY = 'sb_secret_OJOv-kxfDWjoShlQpoutsw_tyDkFNrN'

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || HARD_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || HARD_KEY;

    // Safety Clean: Remove trailing slash
    const supabaseUrl = rawUrl?.replace(/\/$/, "");

    // Validation Logic - Log Warning but DO NOT THROW
    if (!supabaseUrl || !serviceRoleKey) {
        // Only log detailed warning in server logs (visible in Hostinger)
        console.warn('⚠️ [Supabase Admin] Initialization skipped: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
        return null;
    }

    try {
        adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        return adminClient;
    } catch (e) {
        console.error('⚠️ [Supabase Admin] Initialization failed with exception:', e);
        return null;
    }
}

// Deprecated: Alias for backward compatibility if needed, but safe now
export const createAdminClient = getAdminClient;
