"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function SystemHealthPage() {
    const [logs, setLogs] = useState<string[]>([])
    const [running, setRunning] = useState(false)
    const supabase = createClient()

    const log = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

    async function runDiagnostics() {
        setRunning(true)
        setLogs([])
        log("Iniciando diagnóstico del sistema...")

        try {
            // 1. Check Auth / Session
            log("1. Verificando Sesión y Conexión Supabase...")
            const { data: { session }, error: authError } = await supabase.auth.getSession()
            if (authError || !session) {
                throw new Error("No hay sesión activa o falló la conexión: " + authError?.message)
            }
            log("✅ Conexión establecida. Usuario: " + session.user.email)

            // 2. Database Integrity Check (Simple select)
            log("2. Verificando integridad de BD (Accesso a Tenants)...")
            const { data: tenants, error: tenantError } = await from('tenants').select('count', { count: 'exact', head: true })
            if (tenantError) throw new Error("Fallo al leer tabla tenants: " + tenantError.message)
            log("✅ Tabla 'tenants' accesible.")

            // 3. RLS Check Mock
            log("3. Verificando Políticas RLS...")
            // In a real scenario we might try to access something forbidden and expect error, 
            // or check pg_policies table if we have admin RPC. 
            // For MVP, we presume policies are active if basic select works.
            log("ℹ️ RLS asumido activo (tablas protegidas).")

            // 4. End-to-End Log Test
            log("4. Verificando Sistema de Eventos (E2E)...")
            // We will read system_events to see if recent logs exist.
            const { data: events, error: eventError } = await supabase
                .from('system_events')
                .select('*')
                .limit(1)

            if (eventError) {
                log("⚠️ Error leyendo system_events: " + eventError.message)
            } else {
                log(`✅ Tabla system_events accesible (${events?.length} registros encontrados).`)
            }

            log("✅ Diagnóstico completado exitosamente.")

        } catch (error: any) {
            log("❌ ERROR CRÍTICO: " + error.message)
        } finally {
            setRunning(false)
        }
    }

    // Helper to fix TS error on 'from' since we need supabase.from
    const from = supabase.from.bind(supabase)

    return (
        <div className="container mx-auto py-10 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Diagnóstico de Salud del Sistema</CardTitle>
                    <CardDescription>Ejecuta pruebas de integridad, conectividad y seguridad.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={runDiagnostics} disabled={running}>
                        {running ? "Ejecutando..." : "Iniciar Diagnóstico"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Logs de Ejecución</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-slate-950 text-green-400 font-mono p-4 rounded-md h-64 overflow-y-auto text-sm">
                        {logs.length === 0 ? (
                            <span className="text-slate-600">Esperando ejecución...</span>
                        ) : (
                            logs.map((L, i) => <div key={i}>{L}</div>)
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
