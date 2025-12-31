import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from "./constants"

export const getAdminClient = () => {
    // Priority: Env Vars -> Hardcoded Fallback (Verified Working)
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_CONFIG.URL).trim().replace(/\/$/, "");
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_CONFIG.SERVICE_ROLE_KEY;

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
