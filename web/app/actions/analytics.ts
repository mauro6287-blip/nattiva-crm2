'use server'

import { createClient } from "@/utils/supabase/server"

export type KPIStats = {
    total_socios: number
    socios_con_rut: number
    tasa_verificacion: number
    total_cargas: number
}

export type AnalyticsEvent = {
    id: string
    event_name: string
    event_data: any
    created_at: string
    user_id: string | null
}

export async function logEvent(eventName: string, metadata: any = {}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile || !('tenant_id' in (profile as any))) return

        // @ts-ignore
        await supabase.from('analytics_events').insert({
            tenant_id: (profile as any).tenant_id,
            user_id: user.id,
            event_name: eventName,
            event_data: metadata
        })
    } catch (e) {
        console.error('Failed to log analytics event', e)
    }
}

export async function getAnalytics(): Promise<{ kpis: KPIStats, recentEvents: AnalyticsEvent[] } | { error: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Get Tenant Context
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile || !('tenant_id' in (profile as any))) {
        return { error: 'No tenant found' }
    }

    // safe cast for usage
    const tenantId = (profile as any).tenant_id as string

    // 2. Fetch KPIs from View
    const { data: kpiData, error: kpiError } = await supabase
        .from('view_tenant_kpis')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

    // 3. Fetch Recent Events
    const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5)

    // Handle initial state seamlessly
    const stats: KPIStats = {
        total_socios: Number((kpiData as any)?.total_socios) || 0,
        socios_con_rut: Number((kpiData as any)?.socios_con_rut) || 0,
        tasa_verificacion: ((kpiData as any)?.total_socios || 0) > 0
            ? Math.round((Number((kpiData as any)?.socios_con_rut) / Number((kpiData as any)?.total_socios)) * 100)
            : 0,
        total_cargas: Number((kpiData as any)?.total_cargas) || 0
    }

    return {
        kpis: stats,
        recentEvents: events || []
    }
}
