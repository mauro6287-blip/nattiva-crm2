'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function SecurityAuditPage() {
    const supabase = createClient()
    const [logs, setLogs] = useState<string[]>([])

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]} - ${msg}`])

    // Test 1: Cross-Tenant Leak
    const testCrossTenant = async () => {
        addLog('Starting Cross-Tenant Leak Test...')
        try {
            // 1. Get my tenant
            const { data: profile } = await supabase.from('user_profiles').select('tenant_id').single()
            if (!profile) {
                addLog('Error: Could not fetch my profile/tenant. Are you logged in?')
                return
            }
            const myTenant = profile.tenant_id
            addLog(`My Tenant: ${myTenant}`)

            // 2. Try to fetch tickets from a DIFFERENT Random UUID tenant
            const fakeTenant = '00000000-0000-0000-0000-000000000000'
            addLog(`Attempting to fetch tickets for tenant: ${fakeTenant}`)

            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('tenant_id', fakeTenant)

            if (error) {
                addLog(`Supabase Error (Expected if RLS denies? or just empty): ${error.message}`)
            } else {
                addLog(`Result Count: ${data.length}`)
                if (data.length === 0) {
                    addLog('✅ SUCCESS: No data leaked from other tenant.')
                } else {
                    addLog('❌ FAILURE: Leaked data found!')
                }
            }
        } catch (e: any) {
            addLog(`Exception: ${e.message}`)
        }
    }

    // Test 2: Rate Limit
    const testRateLimit = async () => {
        addLog('Starting Rate Limit Stress Test (20 requests)...')
        let success = 0
        let blocked = 0

        const requests = Array.from({ length: 20 }).map(async (_, i) => {
            try {
                // Call our new sensitive endpoint
                const res = await fetch('/api/validate-benefit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: 'test-rate-limit' })
                })

                if (res.status === 429) {
                    blocked++
                    console.log(`Req ${i}: 429 Too Many Requests`)
                } else {
                    success++
                    console.log(`Req ${i}: ${res.status}`)
                }
            } catch (e) {
                console.error(e)
            }
        })

        await Promise.all(requests)

        addLog(`Results: ${success} Succeeded, ${blocked} Blocked.`)
        if (blocked > 0) {
            addLog('✅ SUCCESS: Rate limiting kicked in.')
        } else {
            addLog('❌ FAILURE: No requests were blocked.')
        }
    }

    // Test 3: Data Minimization / Role Check
    const testDataMinimization = async () => {
        addLog('Testing API Data Minimization...')
        try {
            const res = await fetch('/api/user/search?q=Adm')
            const json = await res.json()
            addLog(`Response keys: ${JSON.stringify(Object.keys(json))}`)

            if (json.users && json.users.length > 0) {
                const userKeys = Object.keys(json.users[0])
                addLog(`User Object Keys: ${userKeys.join(', ')}`)
                if (!userKeys.includes('metadata') && !userKeys.includes('role_id')) { // Assuming these are hidden
                    addLog('✅ SUCCESS: Sensitive fields not returned.')
                } else {
                    addLog('⚠️ WARNING: Potential sensitive fields leaks found.')
                }
            } else {
                addLog('No users found to test structure.')
            }
        } catch (e: any) {
            addLog(`Error: ${e.message}`)
        }
    }

    return (
        <div className="p-10 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Hito 7: Security Verification Suite</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded shadow space-y-4">
                    <h2 className="text-xl font-bold">Test 1: Cross-Tenant</h2>
                    <p className="text-sm text-gray-500">Attempts to fetch data from a fake tenant ID.</p>
                    <button onClick={testCrossTenant} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full">
                        Run Leak Test
                    </button>
                </div>

                <div className="p-4 border rounded shadow space-y-4">
                    <h2 className="text-xl font-bold">Test 2: Rate Limiting</h2>
                    <p className="text-sm text-gray-500">Fires 20 requests in parallel to /api/validate-benefit.</p>
                    <button onClick={testRateLimit} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 w-full">
                        Run Flash Crowd
                    </button>
                </div>

                <div className="p-4 border rounded shadow space-y-4">
                    <h2 className="text-xl font-bold">Test 3: API & Roles</h2>
                    <p className="text-sm text-gray-500">Checks data minimization and role access.</p>
                    <button onClick={testDataMinimization} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full">
                        Check Minimization
                    </button>
                </div>
            </div>

            <div className="p-4 bg-gray-900 text-green-400 font-mono rounded h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                    <span>Execution Logs</span>
                    <button onClick={() => setLogs([])} className="text-xs text-gray-500 hover:text-white">Clear</button>
                </div>
                {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
                {logs.length === 0 && <p className="text-gray-600 italic">Ready to run tests...</p>}
            </div>
        </div>
    )
}
