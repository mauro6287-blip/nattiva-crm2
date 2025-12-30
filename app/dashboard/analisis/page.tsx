import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAnalytics } from "@/app/actions/analytics"
import { Users, FileCheck, Baby, Activity } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
    const data = await getAnalytics()

    if ('error' in data) {
        return <div className="p-8 text-red-500">Error cargando analítica: {data.error}</div>
    }

    const { kpis, recentEvents } = data

    return (
        <div className="flex flex-col gap-6 p-6">
            <h1 className="text-3xl font-bold tracking-tight">Panel de Analítica</h1>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Socios</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.total_socios}</div>
                        <p className="text-xs text-muted-foreground">Registros totales en base de datos</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Digitalización (RUT)</CardTitle>
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.tasa_verificacion}%</div>
                        <p className="text-xs text-muted-foreground">{kpis.socios_con_rut} socios con RUT validado</p>
                        {/* Progress Bar (CSS) */}
                        <div className="h-2 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${kpis.tasa_verificacion}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cargas Familiares</CardTitle>
                        <Baby className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.total_cargas}</div>
                        <p className="text-xs text-muted-foreground">Total cargas registradas</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{recentEvents.length}</div>
                        <p className="text-xs text-muted-foreground">Eventos en el historial reciente</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Table */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Historial de Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentEvents.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No hay actividad reciente.</p>
                        ) : (
                            recentEvents.map((e) => (
                                <div key={e.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{e.event_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {JSON.stringify(e.event_data)}
                                        </p>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(e.created_at).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
