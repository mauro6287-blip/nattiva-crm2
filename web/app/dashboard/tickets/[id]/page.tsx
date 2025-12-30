import { Suspense } from 'react'
import { getTicketDetails, getMacros } from '@/app/actions/tickets'
import { TicketChat } from '@/app/dashboard/tickets/ticket-chat'
import { StatusSelect } from '@/app/dashboard/tickets/status-select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/utils/supabase/server"
import { Separator } from "@/components/ui/separator"
import { Clock, User as UserIcon, AlertCircle } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const [detail, macros] = await Promise.all([
        getTicketDetails(id),
        getMacros()
    ])

    if ('error' in detail) {
        return <div>Error: {detail.error}</div>
    }

    const { ticket, messages } = detail
    if (!ticket) notFound()

    // Get current user for chat
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // SLA Calculation
    const now = new Date()
    const deadline = new Date(ticket.sla_deadline || now)
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    let slaText = "A Tiempo"
    let slaColor = "text-green-600"
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
        slaText = "Completado"
        slaColor = "text-gray-500"
    } else if (hoursRemaining < 0) {
        slaText = `Vencido hace ${Math.abs(Math.round(hoursRemaining))}h`
        slaColor = "text-red-600 font-bold"
    } else {
        slaText = `Vence en ${Math.round(hoursRemaining)}h`
        if (hoursRemaining < 2) slaColor = "text-yellow-600"
    }

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        {ticket.subject}
                        <Badge variant="outline" className="text-base font-normal">#{ticket.id.slice(0, 8)}</Badge>
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4" /> {slaText}
                        <span className={`text-sm ${slaColor} ml-1`}>●</span>
                    </p>
                </div>

                <TicketChat
                    ticketId={ticket.id}
                    initialMessages={messages}
                    macros={macros}
                    currentUserId={user?.id || ''}
                />
            </div>

            {/* Sidebar Meta Info */}
            <div className="w-[300px] space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Estado</label>
                            <div className="mt-1">
                                <StatusSelect ticketId={ticket.id} currentStatus={ticket.status || 'new'} />
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Prioridad</label>
                            <div className="mt-1 capitalize px-2 py-1 bg-slate-100 rounded inline-block text-sm">
                                {ticket.priority}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Categoría</label>
                            <div className="mt-1 text-sm font-medium">
                                {ticket.category?.name || 'General'}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Solicitante</label>
                            <div className="mt-1 flex items-center gap-2">
                                <div className="bg-gray-100 p-2 rounded-full">
                                    <UserIcon className="w-4 h-4 text-gray-500" />
                                </div>
                                <div className="text-sm overflow-hidden text-ellipsis">
                                    {/* Assuming we might fetch user email strictly if we joined properly or stored it */}
                                    <span className="block truncate max-w-[150px]">
                                        {ticket.user_id ? 'Usuario Registrado' : 'Sistema'}
                                    </span>
                                    {/* Ideally we show email from ticket.user if we fetched it */}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Creado el</label>
                            <div className="mt-1 text-sm">
                                {new Date(ticket.created_at).toLocaleDateString()} {new Date(ticket.created_at).toLocaleTimeString()}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
