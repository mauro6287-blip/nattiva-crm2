"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card" // Using existing card? or standard HTML/Tailwind if not
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

type DashboardStats = {
    socios: {
        total: number
        verified: number
        pending: number
    }
    tickets: {
        total_30d: number
        resolved_30d: number
    }
    validations: {
        result: string
        count: number
    }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsCharts() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function loadStats() {
            try {
                const { data, error } = await supabase.rpc('get_dashboard_stats')
                if (error) throw error
                setStats(data as DashboardStats)
            } catch (err) {
                console.error("Failed to load dashboard stats", err)
            } finally {
                setLoading(false)
            }
        }
        loadStats()
    }, [])

    if (loading) return <div className="p-4 text-center">Cargando métricas...</div>
    if (!stats) return <div className="p-4 text-center">No hay datos disponibles</div>

    const socioData = [
        { name: 'Verificados', value: stats.socios.verified },
        { name: 'Pendientes', value: stats.socios.pending },
        { name: 'Otros', value: stats.socios.total - (stats.socios.verified + stats.socios.pending) }
    ]

    const ticketData = [
        { name: 'Total (30d)', value: stats.tickets.total_30d },
        { name: 'Resueltos (30d)', value: stats.tickets.resolved_30d }
    ]

    // Parse validation stats if null (empty array default)
    const validationData = stats.validations || []

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Métricas del Sistema</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Card 1: Adoption (Pie Chart) */}
                <div className="rounded-xl border bg-card text-card-foreground shadow p-4">
                    <div className="flex flex-col space-y-1.5 pb-4">
                        <h3 className="font-semibold leading-none tracking-tight">Adopción de Socios</h3>
                        <p className="text-sm text-muted-foreground">Estado de verificación</p>
                    </div>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={socioData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {socioData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center text-2xl font-bold">
                        {stats.socios.total} <span className="text-sm font-normal text-muted-foreground">Total</span>
                    </div>
                </div>

                {/* Card 2: Tickets Pulse (Bar Chart) */}
                <div className="rounded-xl border bg-card text-card-foreground shadow p-4">
                    <div className="flex flex-col space-y-1.5 pb-4">
                        <h3 className="font-semibold leading-none tracking-tight">Pulso de Soporte</h3>
                        <p className="text-sm text-muted-foreground">Últimos 30 días</p>
                    </div>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ticketData}>
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Card 3: Validation Stats (Bar Chart) */}
                <div className="rounded-xl border bg-card text-card-foreground shadow p-4">
                    <div className="flex flex-col space-y-1.5 pb-4">
                        <h3 className="font-semibold leading-none tracking-tight">Validaciones de Beneficios</h3>
                        <p className="text-sm text-muted-foreground">Aprobados vs Rechazados</p>
                    </div>
                    <div className="h-[200px] w-full">
                        {validationData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={validationData}>
                                    <XAxis dataKey="result" fontSize={12} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#ff7300" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                Sin datos aún
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
