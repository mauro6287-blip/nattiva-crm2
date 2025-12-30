import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error de conexión: Variables de Supabase no inyectadas')
  }

  return createBrowserClient(
    supabaseUrl!,
    supabaseKey!
  )
}
