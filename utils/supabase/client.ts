import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error de Configuración: La URL de Supabase no ha sido inyectada')
  }

  return createBrowserClient(
    supabaseUrl!,
    supabaseKey!
  )
}
