'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTicket, getCategories, seedDefaults } from '@/app/actions/tickets'
import { Plus } from 'lucide-react'

export function CreateTicketDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<any[]>([])

    useEffect(() => {
        if (open) {
            // Load categories when dialog opens
            seedDefaults().then(() => {
                getCategories().then(setCategories)
            })
        }
    }, [open])

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const res = await createTicket(formData)
        setLoading(false)
        if (res.error) {
            alert(res.error)
        } else {
            setOpen(false)
            // success
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Ticket</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Ticket</DialogTitle>
                    <DialogDescription>
                        Describe el problema para recibir ayuda.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="subject">Asunto</Label>
                        <Input id="subject" name="subject" placeholder="Resumen del problema" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Categoría</Label>
                        <select
                            id="category"
                            name="category_id"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            required
                        >
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name} (SLA: {c.sla_hours_resolution}h)</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="priority">Prioridad</Label>
                        <select
                            id="priority"
                            name="priority"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="low">Baja</option>
                            <option value="medium" selected>Media</option>
                            <option value="high">Alta</option>
                            <option value="critical">Crítica</option>
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="message">Mensaje Inicial</Label>
                        <Textarea id="message" name="message" placeholder="Detalles..." required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creando...' : 'Crear Ticket'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
