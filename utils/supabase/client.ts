import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_CONFIG } from './constants'

export function createClient() {
  // Priority: Env Vars -> Hardcoded Fallback (Verified Working)
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_CONFIG.URL).trim().replace(/\/$/, "")
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_CONFIG.ANON_KEY

  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  )
}
