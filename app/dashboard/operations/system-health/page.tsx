'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Logger } from '@/utils/logger' // We can't use server logger on client directly usually, but let's see. 
// Actually, Logger logic in 'utils/logger.ts' imports 'supabase/admin' which is SERVER only.
// We need a ClientLogger or simply use server actions for the Chaos button.
// For MVP, the chaos button can call a server action or an API route. 
// Let's make the Chaos Button call a new API route `/api/test/chaos` to simulate server errors log.

export default function SystemHealthPage() {
    const supabase = createClient()
    const [metrics, setMetrics] = useState<any>(null)
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [tenantId, setTenantId] = useState<string | null>(null)

    useEffect(() => {
        // Init: get tenant
        async function init() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
                if (profile) {
                    setTenantId(profile.tenant_id)
                    fetchData(profile.tenant_id)
                }
            }
        }
        init()

        // Poll every 10s
        const interval = setInterval(() => {
            if (tenantId) fetchData(tenantId)
        }, 10000)
        return () => clearInterval(interval)
    }, [tenantId])

    const fetchData = async (tid: string) => {
        setLoading(true)
        // 1. Get Metrics RPC
        const { data: metricsData, error: metricsError } = await supabase.rpc('get_system_health_metrics', { p_tenant_id: tid })
        if (metricsData) setMetrics(metricsData)

        // 2. Get Recent Logs
        const { data: logsData, error: logsError } = await supabase
            .from('system_logs')
            .select('*')
            .eq('tenant_id', tid)
            .order('timestamp', { ascending: false })
            .limit(50)

        if (logsData) setLogs(logsData)
        setLoading(false)
    }

    const triggerChaos = async (type: string) => {
        // Call a Next.js API route to generate the log on the server
        // We'll quickly create /api/test/chaos for this.
        await fetch('/api/test/chaos', {
            method: 'POST',
            body: JSON.stringify({ type })
        })
        // Refresh immediately
        if (tenantId) fetchData(tenantId)
    }

    // Calculations for Alert
    const errorRate = metrics ? (metrics.total_24h > 0 ? (metrics.errors_24h / metrics.total_24h) * 100 : 0) : 0
    const isAlert = errorRate > 5

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen text-slate-900">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Operational Dashboard</h1>
                <div className="text-sm text-slate-500">Auto-refreshing every 10s</div>
            </header>

            {/* ALERT BANNER */}
            {isAlert && (
                <div className="bg-red-600 text-white p-4 rounded shadow-lg animate-pulse flex items-center justify-between">
                    <span className="font-bold text-lg">⚠️ HIGH ERROR RATE DETECTED ({errorRate.toFixed(1)}%)</span>
                    <button className="bg-white text-red-600 px-3 py-1 rounded text-sm font-bold">ACKNOWLEDGE</button>
                </div>
            )}

            {/* WIDGETS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Metric 1: 24h Errors */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Errors (24h)</h3>
                    <div className="mt-2 text-3xl font-bold text-slate-900">{metrics?.errors_24h ?? '-'}</div>
                    <div className="text-xs text-slate-400 mt-1">Target: 0</div>
                </div>

                {/* Metric 2: Avg Duration */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Avg Response (p50)</h3>
                    <div className="mt-2 text-3xl font-bold text-slate-900">{metrics?.avg_duration_ms ?? '-'} ms</div>
                    <div className="text-xs text-slate-400 mt-1">Target: &lt; 200ms</div>
                </div>

                {/* Metric 3: Total Logs */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-sm font-medium uppercase">Total Traffic (24h)</h3>
                    <div className="mt-2 text-3xl font-bold text-slate-900">{metrics?.total_24h ?? '-'}</div>
                </div>

                {/* Control: Chaos */}
                <div className="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700 text-white">
                    <h3 className="text-slate-400 text-sm font-medium uppercase mb-3">Chaos Engineering</h3>
                    <div className="flex flex-col space-y-2">
                        <button onClick={() => triggerChaos('webhook_fail')} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-xs font-bold">Simulate 500 Error</button>
                        <button onClick={() => triggerChaos('slow_request')} className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-xs font-bold text-black">Simulate Slow Req</button>
                        <button onClick={() => triggerChaos('valid_login')} className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-xs font-bold">Simulate Login</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LOG FEED */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700">Live System Logs</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Level</th>
                                    <th className="px-4 py-3">Event</th>
                                    <th className="px-4 py-3">Duration</th>
                                    <th className="px-4 py-3">Meta</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 font-mono text-xs text-slate-500">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.level === 'ERROR' || log.level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                    log.level === 'WARN' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-50 text-blue-700'
                                                }`}>
                                                {log.level}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 font-medium text-slate-800">{log.event_type}</td>
                                        <td className="px-4 py-2 text-slate-500">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</td>
                                        <td className="px-4 py-2 text-xs text-slate-400 max-w-xs truncate">
                                            {JSON.stringify(log.metadata)}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">No logs found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* TOP ERRORS */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700">Top Errors (24h)</h3>
                    </div>
                    <div className="p-4">
                        {metrics?.top_errors && metrics.top_errors.length > 0 ? (
                            <ul className="space-y-3">
                                {metrics.top_errors.map((err: any, idx: number) => (
                                    <li key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded">
                                        <span className="font-mono text-xs text-red-600 font-bold truncate mr-2">{err.event_type}</span>
                                        <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-bold">{err.count}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-slate-400 text-sm text-center py-4">No errors recorded.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
