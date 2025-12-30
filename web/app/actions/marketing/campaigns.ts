'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

// Types
export type Campaign = {
    id: string
    tenant_id: string
    name: string
    status: 'draft' | 'scheduled' | 'sent' | 'processing' | 'completed'
    segment_criteria: any
    scheduled_at: string | null
    created_at: string
}

export type AudienceCriteria = {
    status?: 'all' | 'verified' | 'pending' | 'active'
    min_age?: number
    max_age?: number
    // future: role, location, etc.
}

export async function getAudienceSize(criteria: AudienceCriteria) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { count: 0 }

    // Get Tenant
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    if (!profile || typeof profile !== 'object' || !('tenant_id' in (profile as any))) return { count: 0 }
    const tenantId = (profile as any).tenant_id as string

    let query = (supabase
        .from('user_profiles') as any)
        .select('id', { count: 'exact', head: true }) // head=true means we don't get rows, just count
        .eq('tenant_id', tenantId)

    // Apply filters
    if (criteria.status && criteria.status !== 'all') {
        if (criteria.status === 'verified') {
            // Logic for verified: has rut + email? Or explicit status?
            // "Verified" usually means is_active=true or status='verified' (if column exists)
            // Let's assume verified = rut is not null for now, or use 'is_active' if we had it.
            // Based on previous code, we just count all or filter by some logic.
            // Let's use:
            query = query.not('rut', 'is', null) // Only user with RUT
        }
        else if (criteria.status === 'pending') {
            query = query.is('rut', null)
        }
    }

    const { count, error } = await query

    if (error) {
        console.error('Audience Count Error:', error)
        return { count: 0 }
    }

    return { count: count || 0 }
}

export async function createCampaign(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    if (!profile || typeof profile !== 'object' || !('tenant_id' in (profile as any))) return { error: 'Perfil o Sindicato no encontrado' }
    const tenantId = (profile as any).tenant_id as string

    const name = formData.get('name') as string
    const subject = formData.get('subject') as string
    const content = formData.get('content') as string
    const segment = formData.get('segment') as string // 'all', 'verified', 'pending'
    const scheduledAt = formData.get('scheduled_at') as string // can be null/empty

    if (!name || !subject || !content) {
        return { error: 'Faltan campos obligatorios' }
    }

    // 1. Create Template (Implicitly for this campaign for simplicity, or we reuse?)
    // Requirement says "Template ID". For MVP H12, we can create a one-off template per campaign
    // to keep it simple, or selection logic. Let's create one-off.

    // First, insert template
    const { data: template, error: tmplError } = await (supabase
        .from('marketing_templates') as any)
        .insert({
            tenant_id: tenantId,
            name: `${name} - Template`,
            subject: subject,
            html_content: content
        })
        .select('id')
        .single()

    if (tmplError || !template) {
        return { error: 'Error creando plantilla: ' + tmplError?.message }
    }

    // 2. Create Campaign
    const { error: campError } = await (supabase
        .from('marketing_campaigns') as any)
        .insert({
            tenant_id: tenantId,
            name: name,
            segment_criteria: { status: segment },
            status: scheduledAt ? 'scheduled' : 'draft',
            scheduled_at: scheduledAt || null,
            template_id: template.id
        })

    if (campError) {
        return { error: 'Error creando campaña: ' + campError.message }
    }

    revalidatePath('/dashboard/campanas')
    return { success: true }
}

export async function processCampaignMock(campaignId: string) {
    // This action simulates the "Send Now" or "Cron Job" execution
    const supabase = await createClient()

    // 1. Get Campaign
    const { data: campaign } = await (supabase.from('marketing_campaigns') as any).select('*').eq('id', campaignId).single()
    if (!campaign) return { error: 'Campaña no encontrada' }

    // 2. Mock Sending
    // Find Users
    const criteria = (campaign as any).segment_criteria || {}
    const campaignTenantId = (campaign as any).tenant_id
    let query = (supabase.from('user_profiles') as any).select('id').eq('tenant_id', campaignTenantId)

    // Simplistic Re-implementation of filter (DRY usually involves a helper, but ok for now)
    if (criteria.status && criteria.status !== 'all') {
        if (criteria.status === 'verified') query = query.not('rut', 'is', null)
        else if (criteria.status === 'pending') query = query.is('rut', null)
    }

    const { data: users } = await query
    if (!users || users.length === 0) return { success: true, count: 0 }

    // 3. Log "Sent"
    const logs = users.map((u: any) => ({
        campaign_id: campaignId,
        user_id: u.id,
        status: 'sent'
        // created_at default now
    }))

    // Batch insert logs
    const { error: logError } = await (supabase.from('marketing_logs') as any).insert(logs)
    if (logError) return { error: logError.message }

    // 4. Update Campaign Status
    await (supabase.from('marketing_campaigns') as any).update({ status: 'sent' }).eq('id', campaignId)

    revalidatePath('/dashboard/campanas')
    return { success: true, count: users.length }
}

export async function getCampaigns() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get Tenant
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile || typeof profile !== 'object' || !('tenant_id' in (profile as any))) return []
    const tenantId = (profile as any).tenant_id as string

    const { data } = await (supabase
        .from('marketing_campaigns') as any)
        .select('*, marketing_templates(subject)') // Join template to get subject
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    return data || []
}
