'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PlusCircle, Building, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createProvider, getProviders, Provider } from '@/app/actions/providers/provider-actions'
import { useRouter } from 'next/navigation'

export default function AdminProvidersPage() {
    const [providers, setProviders] = useState<Provider[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const router = useRouter()

    useEffect(() => {
        loadProviders()
    }, [])

    function formatDate(dateString: string) {
        const d = new Date(dateString)
        const day = d.getDate().toString().padStart(2, '0')
        const month = (d.getMonth() + 1).toString().padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
    }

    async function loadProviders() {
        setLoading(true)
        const data = await getProviders()
        setProviders(data)
        setLoading(false)
    }

    async function handleCreate(formData: FormData) {
        setIsCreating(true)
        const res = await createProvider(formData)
        setIsCreating(false)
        if (res.error) {
            alert(res.error)
        } else {
            alert('Proveedor creado exitosamente')
            loadProviders()
            // Reset form? relying on native behavior or just reload list which we did
            // In a real app we'd clear the input.
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Proveedores</h1>
                <p className="text-muted-foreground">Administra las empresas externas y sus accesos.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Create Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Registrar Nuevo Proveedor</CardTitle>
                        <CardDescription>Dar de alta una nueva empresa colaboradora.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre de la Empresa</Label>
                                <Input name="name" placeholder="Ej: Farmacias Cruz Verde" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Email de Contacto (Admin)</Label>
                                <Input name="email" type="email" placeholder="contacto@empresa.com" />
                            </div>
                            <Button type="submit" disabled={isCreating} className="w-full">
                                {isCreating ? 'Guardando...' : <><PlusCircle className="mr-2 h-4 w-4" /> Registrar Empresa</>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-slate-50 border-dashed">
                    <CardHeader>
                        <CardTitle>Sobre el Portal de Proveedores</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            Al registrar un proveedor, se habilita un espacio de trabajo donde podrán gestionar sus propias sucursales y operadores.
                        </p>
                        <p>
                            Para acceder como proveedor, se debe utilizar el <strong>Portal de Proveedores</strong>.
                        </p>
                        <Button variant="outline" size="sm" asChild className="mt-4">
                            <Link href="/dashboard/portal-proveedor">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ir al Portal (Simulación)
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            <Card>
                <CardHeader>
                    <CardTitle>Empresas Registradas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Email Contacto</TableHead>
                                <TableHead>Fecha Registro</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">Cargando...</TableCell>
                                </TableRow>
                            ) : providers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No hay proveedores registrados.</TableCell>
                                </TableRow>
                            ) : (
                                providers.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Building className="h-4 w-4 text-muted-foreground" />
                                            {p.name}
                                        </TableCell>
                                        <TableCell>{p.contact_email || '-'}</TableCell>
                                        <TableCell>
                                            {formatDate(p.created_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                {/* In a real app we would pass the ID or Context. For verification we link to portal pretending to be them, or just manage them */}
                                                <Link href={`/dashboard/portal-proveedor?provider_id=${p.id}`}>
                                                    Administrar
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
