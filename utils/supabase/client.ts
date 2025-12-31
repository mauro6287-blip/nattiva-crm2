import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Faltan las variables de entorno de Supabase. Verifica tu archivo .env o la configuración en Hostinger.')
  }

  const normalizedUrl = supabaseUrl?.replace(/\/$/, '') || ''

  return createBrowserClient(
    normalizedUrl,
    supabaseKey || ''
  )
}
