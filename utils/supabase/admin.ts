import { createClient } from '@supabase/supabase-js';

export const getAdminClient = () => {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!rawUrl || !supabaseServiceKey) return null;

    // Clean URL just in case
    const supabaseUrl = rawUrl.trim().replace(/\/$/, "");

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
};

// Deprecated alias for backward compatibility
export const createAdminClient = getAdminClient;
