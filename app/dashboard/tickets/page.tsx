import { Suspense } from 'react'
import { getTickets } from '@/app/actions/tickets'
import { CreateTicketDialog } from './create-ticket-dialog'
import { TicketRow } from './ticket-row'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default async function TicketsInboxPage() {
    let tickets: any[] = []
    let error: string | null = null

    try {
        tickets = await getTickets()
    } catch (err: any) {
        console.error("UI Fetch Error Details:", err)
        // Show the raw error message to the user for debugging
        error = err.message || JSON.stringify(err)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tickets de Soporte</h2>
                    <p className="text-muted-foreground">Gestión de incidentes y requerimientos.</p>
                </div>
                <CreateTicketDialog />
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                <span className="font-bold">Error Crítico: </span>
                                {error}
                            </p>
                            <p className="text-xs text-red-500 mt-1">Por favor comparte este error con soporte.</p>
                        </div>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Bandeja de Entrada</CardTitle>
                    <CardDescription>Tickets ordenados por urgencia y fecha.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Estado</TableHead>
                                <TableHead>Asunto</TableHead>
                                <TableHead>Prioridad</TableHead>
                                <TableHead>Categoría / SLA</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead className="text-right">Creado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No hay tickets pendientes.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tickets.map((t, index) => (
                                    <TicketRow key={t.id || `ticket-${index}`} ticket={t} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

// TicketRow has been moved to a separate client component for interactivity
