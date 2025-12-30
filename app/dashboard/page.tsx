import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CreditCard, AlertCircle } from 'lucide-react'
import AnalyticsCharts from '@/components/dashboard/analytics-charts'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
                <p className="text-muted-foreground">Bienvenido de vuelta, {user?.email}</p>
            </div>

            {/* Dynamic Analytics Charts */}
            <AnalyticsCharts />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">No hay actividad reciente para mostrar.</p>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Accesos Rápidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="p-3 bg-slate-100 rounded text-sm text-center text-slate-500">Registrar Nuevo Socio</div>
                            <div className="p-3 bg-slate-100 rounded text-sm text-center text-slate-500">Validar Convenio</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
