'use client'

import { updateTicketStatus } from '@/app/actions/tickets'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useState } from 'react'

export function StatusSelect({ ticketId, currentStatus }: { ticketId: string, currentStatus: string }) {
    const [loading, setLoading] = useState(false)

    async function handleValueChange(val: string) {
        setLoading(true)
        try {
            await updateTicketStatus(ticketId, val)
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    return (
        <Select defaultValue={currentStatus} onValueChange={handleValueChange} disabled={loading}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="new">Nuevo</SelectItem>
                <SelectItem value="open">Abierto</SelectItem>
                <SelectItem value="waiting_user">Esperando Usuario</SelectItem>
                <SelectItem value="resolved">Resuelto</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
            </SelectContent>
        </Select>
    )
}
