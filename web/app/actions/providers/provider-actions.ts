'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export type Provider = {
    id: string
    name: string
    contact_email: string | null
    created_at: string
}

export type ProviderBranch = {
    id: string
    name: string
    address: string | null
    is_active: boolean
    created_at: string
}

// Admin Actions
export async function createProvider(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get Tenant
    const { data: profile } = await (supabase.from('user_profiles') as any).select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'No tenant context' }

    // Debug: Log context
    console.log('[createProvider] User:', user.id, 'Tenant:', profile?.tenant_id)

    const name = formData.get('name') as string
    const email = formData.get('email') as string

    if (!name) return { error: 'Nombre es requerido' }

    const { error, data: newProvider } = await (supabase.from('providers') as any).insert({
        tenant_id: profile.tenant_id,
        name,
        contact_email: email
    }).select()

    if (error) {
        console.error('[createProvider] DB Error:', error)
        return { error: `Error DB: ${error.message} (Code: ${error.code})` }
    }

    // Force refresh
    revalidatePath('/dashboard/proveedores')
    return { success: true }
}

export async function getProviders() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // RLS handles tenant filter if configured correctly, but we need tenant_id for insertion usually.
    // For select, RLS "Tenant Admins can manage providers" uses auth.uid -> user_profiles -> tenant_id.

    const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error(error)
        return []
    }
    return data
}

// Provider Portal Actions

// Helper to get current provider context for the user
// 1. If Admin, maybe we pass providerId explicitly? For now, we assume this action is called by a Provider User.
// Or we implement a "Switch Context" for admin. 
// For H13 MVP, let's assume valid provider user OR admin passing provider_id.
// To keep it simple, we'll make them take `providerId` as arg, and RLS will enforce access.

export async function createBranch(providerId: string, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const address = formData.get('address') as string

    if (!name) return { error: 'Nombre de sucursal requerido' }

    const { error } = await (supabase.from('provider_branches') as any).insert({
        provider_id: providerId,
        name,
        address
    })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/portal-proveedor')
    return { success: true }
}

export async function toggleBranchStatus(branchId: string, currentStatus: boolean) {
    const supabase = await createClient()

    const { error } = await (supabase
        .from('provider_branches') as any)
        .update({ is_active: !currentStatus })
        .eq('id', branchId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/portal-proveedor')
    return { success: true }
}

export async function getProviderBranches(providerId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('provider_branches')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
    return data || []
}

export async function getProviderStats(providerId: string) {
    // Mock metrics for now as requested
    // In future, we count rows in `analytics_events` joined with branch info or similar.
    return {
        total_validations: 1240, // Mock
        active_branches: 0, // Will fill below
        top_branch: 'Centro Histórico' // Mock
    }
}
