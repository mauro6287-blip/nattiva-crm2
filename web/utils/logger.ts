import { createAdminClient } from '@/utils/supabase/admin'

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'

export interface LogEntry {
    tenant_id?: string
    actor_id?: string
    request_id?: string
    duration_ms?: number
    metadata?: any
}

export class Logger {
    private static sanitize(data: any): any {
        if (!data) return data
        if (typeof data !== 'object') return data

        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'api_key']

        if (Array.isArray(data)) {
            return data.map(item => Logger.sanitize(item))
        }

        const sanitized: any = {}
        for (const key in data) {
            if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
                sanitized[key] = '[REDACTED]'
            } else if (typeof data[key] === 'object') {
                sanitized[key] = Logger.sanitize(data[key])
            } else {
                sanitized[key] = data[key]
            }
        }
        return sanitized
    }

    static async log(
        level: LogLevel,
        eventType: string,
        data: LogEntry = {}
    ) {
        // We use console for immediate dev feedback (optional)
        const timestamp = new Date().toISOString()
        const sanitizedMeta = Logger.sanitize(data.metadata || {})

        // Console output (structured-ish)
        const logLine = `[${timestamp}] [${level}] [${eventType}] ${data.request_id ? `(${data.request_id})` : ''}`
        if (level === 'ERROR' || level === 'CRITICAL') {
            console.error(logLine, sanitizedMeta)
        } else {
            console.log(logLine)
        }

        // Persist to Supabase
        // Note: For high throughput, we might queue these or use a separate ingest service.
        // For MVP/Monolith, direct insert is fine.
        try {
            const supabase = createAdminClient()

            // If tenant_id is missing, we might try to infer or leave null (system wide)

            await (supabase.from('system_logs') as any).insert({
                level,
                event_type: eventType,
                tenant_id: data.tenant_id || null, // Ensure your policies or table definition allows null if needed
                actor_id: data.actor_id || null,
                request_id: data.request_id || null,
                duration_ms: data.duration_ms || null,
                metadata: sanitizedMeta,
                timestamp: timestamp
            })

        } catch (err) {
            // Failsafe: Don't crash app if logging fails, but print to stderr
            console.error('FAILED TO PERSIST LOG:', err)
        }
    }
}
