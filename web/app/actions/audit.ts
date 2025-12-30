'use server'

import { createClient } from "@/utils/supabase/server"

export async function getAuditLogs(filters?: { table?: string, operation?: string, limit?: number }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Self-Audit: Log that this user is accessing audit logs?
    // In a real system we would insert into audit_logs here manually "VIEW_AUDIT_LOGS"

    if (!user) return []

    let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50)

    if (filters?.table) {
        query = query.eq('table_name', filters.table)
    }
    if (filters?.operation && filters.operation !== 'ALL') {
        query = query.eq('operation', filters.operation)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching audit logs:', error)
        return []
    }

    // Enhance logs with actor email if possible?
    // We can do a second query to map actor_id to email
    if (data && data.length > 0) {
        const actorIds = Array.from(new Set((data as any[]).map(l => l.actor_id).filter(Boolean)))
        const { data: actors } = await supabase
            .from('user_profiles')
            .select('id, full_name, email')
            .in('id', actorIds)

        const actorMap = new Map((actors as any[])?.map(a => [a.id, a]) || [])

        return (data as any[]).map(log => ({
            ...log,
            actor: actorMap.get(log.actor_id) || { email: 'System', full_name: 'System' }
        }))
    }

    return data
}
