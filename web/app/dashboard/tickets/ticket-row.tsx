'use client'

import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface TicketRowProps {
    ticket: any
}

export function TicketRow({ ticket }: TicketRowProps) {
    const router = useRouter()

    // SLA Traffic Light Calculation (Client Side)
    const now = new Date()
    const deadline = new Date(ticket.sla_deadline || now)
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)

    let slaColor = "bg-green-500"
    let slaText = "A Tiempo"

    if (ticket.status === 'resolved' || ticket.status === 'closed') {
        slaColor = "bg-gray-400"
        slaText = "Completado"
    } else if (hoursRemaining < 0) {
        slaColor = "bg-red-500 animate-pulse"
        slaText = `Vencido (${Math.abs(Math.round(hoursRemaining))}h)`
    } else if (hoursRemaining < 2) {
        slaColor = "bg-yellow-500"
        slaText = `Por Vencer (${Math.round(hoursRemaining * 10) / 10}h)`
    }

    const statusMap: Record<string, string> = {
        'new': 'Nuevo',
        'open': 'Abierto',
        'waiting_user': 'Esp. Usuario',
        'resolved': 'Resuelto',
        'closed': 'Cerrado'
    }
    const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        'new': 'default',
        'open': 'default',
        'waiting_user': 'secondary',
        'resolved': 'outline',
        'closed': 'outline'
    }

    return (
        <TableRow
            className="group cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
        >
            <TableCell>
                <Badge variant={statusVariant[ticket.status] || 'default'}>
                    {statusMap[ticket.status] || ticket.status}
                </Badge>
            </TableCell>
            <TableCell className="font-medium">
                {ticket.subject}
            </TableCell>
            <TableCell>
                <div className="capitalize text-sm">{ticket.priority}</div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{ticket.category?.name}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <div className={`w-2 h-2 rounded-full ${slaColor}`} />
                        {slaText}
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{ticket.user?.full_name || 'Usuario'}</span>
                    <span className="text-xs text-muted-foreground">{ticket.user?.email}</span>
                </div>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
                {new Date(ticket.created_at).toLocaleDateString()}
            </TableCell>
        </TableRow>
    )
}
