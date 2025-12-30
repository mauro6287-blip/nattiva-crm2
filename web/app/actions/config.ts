'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Database } from '@/types_db'
import { revalidatePath } from 'next/cache'

// Service Role client for writing to tenants table
const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

interface IntegrationConfig {
    goodbarber?: {
        app_id: string
        api_key: string
    }
}

export async function updateTenantConfig(configData: IntegrationConfig) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    // 1. Get User's Tenant securely
    // We strictly use auth.uid() to find the profile
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile || !('tenant_id' in (profile as any))) {
        return { error: 'Usuario no tiene un sindicato asignado.' }
    }
    const tenantId = (profile as any).tenant_id as string

    // Optional: Check if user is admin
    const userRole = (profile as any).role
    if (userRole !== 'admin' && userRole !== 'superadmin') {
        return { error: 'Se requieren permisos de administrador.' }
    }

    // 2. Fetch current config to merge
    const { data: tenant, error: fetchError } = await supabaseAdmin
        .from('tenants')
        .select('config')
        .eq('id', tenantId)
        .single()

    if (fetchError || !tenant) {
        return { error: 'Error al obtener configuración actual.' }
    }

    const currentConfig = ((tenant as any).config) || {}

    // 3. Merge new config
    // We merge the goodbarber object specifically if it exists in currentConfig, to be safe, 
    // or just overwrite the goodbarber key as requested.
    // The prompt says "Mezcla el objeto existente con los nuevos datos de GoodBarber".
    // Assuming configData contains the whole 'goodbarber' object.
    const newConfig = {
        ...currentConfig,
        goodbarber: {
            ...(currentConfig.goodbarber || {}),
            ...configData.goodbarber
        }
    }

    // 4. Update Tenant
    const { error: updateError } = await (supabaseAdmin
        .from('tenants') as any)
        .update({ config: newConfig })
        .eq('id', tenantId)

    if (updateError) {
        console.error('Update Config Error:', updateError)
        return { error: 'Error al guardar la configuración.' }
    }

    revalidatePath('/dashboard/configuracion')
    return { success: true }
}

export async function getTenantConfig() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile || !('tenant_id' in (profile as any))) return { error: 'No tenant' }
    const tenantId = (profile as any).tenant_id as string

    // Use Admin client to bypass RLS on tenants table
    const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('config')
        .eq('id', tenantId)
        .single()

    // Return typed config or just raw
    return { config: (tenant as any)?.config }
}
