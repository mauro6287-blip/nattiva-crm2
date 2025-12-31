import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!rawUrl || !supabaseKey) {
    console.error('Faltan las variables de entorno de Supabase. Verifica tu archivo .env o la configuración en Hostinger.')
  }

  const normalizedUrl = rawUrl?.trim().replace(/\/$/, '') || ''

  return createBrowserClient(
    normalizedUrl,
    supabaseKey || ''
  )
}
