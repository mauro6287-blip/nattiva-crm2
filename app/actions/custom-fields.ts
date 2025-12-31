'use server'


import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper to slugify
const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '_')
}

export async function getCustomFields() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get tenant
    const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile || !('tenant_id' in (profile as any))) return []
    const tenantId = (profile as any).tenant_id as string

    const { data, error } = await supabase
        .from('organization_fields')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error getting organization fields:', error)
        return []
    }
    return data
}

export async function saveCustomField(data: any) {
    const supabase = await createClient() // Use user client, relies on RLS
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant
    const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile || !('tenant_id' in (profile as any))) return { error: 'No authorized' }
    const tenantId = (profile as any).tenant_id as string

    const { id, ...payload } = data

    // Ensure options is jsonb/array
    let options = payload.options
    if (typeof options === 'string') {
        options = options.split(',').map((o: string) => o.trim())
    }

    // Auto-generate key if not present (only for new)
    let field_key = payload.field_key
    if (!field_key && !id && payload.label) {
        field_key = slugify(payload.label)
    }

    // Update payload with processed values
    payload.options = options
    payload.field_key = field_key
    payload.data_type = payload.field_type || payload.data_type

    if (id) {
        const { error } = await (supabase
            .from('organization_fields') as any)
            .update(payload)
            .eq('id', id)
            .eq('tenant_id', tenantId)

        if (error) return { error: error.message }
    } else {
        const { error } = await (supabase
            .from('organization_fields') as any)
            .insert({ ...payload, tenant_id: tenantId })
        if (error) return { error: error.message }
    }

    revalidatePath('/dashboard/socios/configuracion')
    revalidatePath('/dashboard/socios/new')
    return { success: true }
}

export async function deleteCustomField(id: string) {
    const supabase = await createClient()
    // Soft delete
    const { error } = await (supabase.from('organization_fields') as any).update({ is_active: false }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/socios/configuracion')
    return { success: true }
}
