'use client'

import { createSocio } from "../actions"
import { getCustomFields } from "@/app/actions/custom-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { useActionState, useEffect, useState } from "react"

const initialState = {
    error: '',
}

export default function NewSocioPage() {
    const [state, formAction, isPending] = useActionState(createSocio, initialState)
    const [customFields, setCustomFields] = useState<any[]>([])

    useEffect(() => {
        // Fetch fields client side for now to avoid major refactor
        // In a perfect world, we'd pass this from a layout or server parent.
        const loadFields = async () => {
            const { getCustomFields } = await import("@/app/actions/custom-fields")
            const fields = await getCustomFields()
            setCustomFields(fields || [])
        }
        loadFields()
    }, [])

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Registrar Nuevo Socio</CardTitle>
                    <CardDescription>
                        Ingrese los datos personales del nuevo socio.
                    </CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        {state?.error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                                {state.error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="names">Nombres *</Label>
                                <Input id="names" name="names" placeholder="Ej: Juan Andrés" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="surnames">Apellidos *</Label>
                                <Input id="surnames" name="surnames" placeholder="Ej: Pérez González" required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rut_or_document">RUT o Documento *</Label>
                            <Input id="rut_or_document" name="rut_or_document" placeholder="Ej: 12.345.678-9" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input id="email" name="email" type="email" placeholder="juan@ejemplo.com" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="join_date">Fecha de Ingreso</Label>
                            <Input id="join_date" name="join_date" type="date" />
                        </div>

                        {/* Custom Fields Section */}
                        {customFields.length > 0 && (
                            <div className="pt-4 border-t space-y-4">
                                <h4 className="font-semibold text-sm text-gray-500">Información Adicional</h4>
                                {customFields.map((field) => (
                                    <div key={field.id} className="space-y-2">
                                        <Label htmlFor={`custom_${field.id}`}>
                                            {field.label} {field.is_required && '*'}
                                        </Label>

                                        {field.field_type === 'select' ? (
                                            <select
                                                id={`custom_${field.id}`}
                                                name={`custom_${field.id}`}
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                required={field.is_required}
                                            >
                                                <option value="">Seleccione una opción</option>
                                                {field.options?.map((opt: string) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <Input
                                                type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                                                id={`custom_${field.id}`}
                                                name={`custom_${field.id}`}
                                                required={field.is_required}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/socios">Cancelar</Link>
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Guardando...' : 'Guardar Socio'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
