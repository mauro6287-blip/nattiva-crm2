'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Activity, MapPin, Users, Plus, CheckCircle, XCircle } from 'lucide-react'
import { useState, useEffect, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBranch, getProviderBranches, getProviderStats, toggleBranchStatus, ProviderBranch } from '@/app/actions/providers/provider-actions'
import { getProviderTeam, addProviderUser, removeProviderUser, ProviderUser } from '@/app/actions/providers/team-actions'
import { Trash2, UserPlus, Mail } from 'lucide-react'

export default function ProviderPortalPage() {
    const searchParams = useSearchParams()
    // For simulation/MVP, we take provider_id from query. 
    // In real app, this comes from session/context.
    const providerId = searchParams.get('provider_id')

    const [stats, setStats] = useState<any>(null)
    const [branches, setBranches] = useState<ProviderBranch[]>([])
    const [team, setTeam] = useState<ProviderUser[]>([])
    const [loading, setLoading] = useState(false)
    const [isCreatingBranch, setIsCreatingBranch] = useState(false)
    const [isAddingMember, setIsAddingMember] = useState(false)

    useEffect(() => {
        if (providerId) {
            loadData()
        }
    }, [providerId])

    async function loadData() {
        if (!providerId) return
        setLoading(true)
        const [s, b, t] = await Promise.all([
            getProviderStats(providerId),
            getProviderBranches(providerId),
            getProviderTeam(providerId)
        ])
        setStats(s)
        setBranches(b)
        setTeam(t)
        setLoading(false)
    }

    async function handleCreateBranch(formData: FormData) {
        if (!providerId) return
        setIsCreatingBranch(true)
        const res = await createBranch(providerId, formData)
        setIsCreatingBranch(false)
        if (res.error) {
            alert(res.error)
        } else {
            alert('Sucursal creada')
            loadData()
        }
    }

    async function handleAddMember(formData: FormData) {
        if (!providerId) return
        setIsAddingMember(true)
        const email = formData.get('email') as string
        const name = formData.get('name') as string
        const role = formData.get('role') as string

        const res = await addProviderUser(providerId, email, role, name)
        setIsAddingMember(false)

        if (res.error) alert(res.error)
        else {
            alert('Miembro agregado')
            loadData()
        }
    }

    async function handleRemoveMember(id: string) {
        if (!confirm('¿Eliminar a este usuario del equipo?')) return
        const res = await removeProviderUser(id)
        if (res.error) alert(res.error)
        else loadData()
    }

    async function handleToggleStatus(branch: ProviderBranch) {
        if (!confirm('¿Cambiar estado de sucursal?')) return
        const res = await toggleBranchStatus(branch.id, branch.is_active)
        if (res.error) alert(res.error)
        else loadData()
    }

    if (!providerId) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold">Portal de Proveedores</h1>
                <p className="text-muted-foreground">Por favor selecciona un proveedor desde la administración para simular la vista.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Portal de Proveedor</h1>
                <p className="text-muted-foreground">Vista simulada ID: <span className="font-mono text-xs bg-slate-100 p-1 rounded">{providerId}</span></p>
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList>
                    <TabsTrigger value="dashboard">Tablero</TabsTrigger>
                    <TabsTrigger value="branches">Sucursales</TabsTrigger>
                    <TabsTrigger value="team">Equipo</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Validaciones Totales</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.total_validations || 0}</div>
                                <p className="text-xs text-muted-foreground">Uso histórico de beneficios</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Sucursales Activas</CardTitle>
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{branches.filter(b => b.is_active).length}</div>
                                <p className="text-xs text-muted-foreground">De {branches.length} registradas</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Top Sucursal</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.top_branch || '-'}</div>
                                <p className="text-xs text-muted-foreground">Mayor volumen de validaciones</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="branches" className="mt-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestión de Sucursales</CardTitle>
                            <CardDescription>Administra los puntos de atención física.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-8 items-start">
                                {/* Create Branch Form */}
                                <div className="w-1/3 min-w-[300px] border-r pr-8">
                                    <h3 className="font-semibold mb-4 text-sm">Nueva Sucursal</h3>
                                    <form action={handleCreateBranch} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Nombre</Label>
                                            <Input name="name" placeholder="Ej: Sucursal Centro" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Dirección</Label>
                                            <Input name="address" placeholder="Av. Principal 123" />
                                        </div>
                                        <Button type="submit" disabled={isCreatingBranch} className="w-full">
                                            {isCreatingBranch ? 'Creando...' : <><Plus className="mr-2 h-4 w-4" /> Agregar</>}
                                        </Button>
                                    </form>
                                </div>

                                {/* List */}
                                <div className="flex-1">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Dirección</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {branches.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No tienes sucursales registradas.</TableCell>
                                                </TableRow>
                                            ) : (
                                                branches.map((b) => (
                                                    <TableRow key={b.id}>
                                                        <TableCell className="font-medium">{b.name}</TableCell>
                                                        <TableCell>{b.address || '-'}</TableCell>
                                                        <TableCell>
                                                            {b.is_active ?
                                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Activa</Badge>
                                                                :
                                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inactiva</Badge>
                                                            }
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleToggleStatus(b)}
                                                                title={b.is_active ? "Desactivar" : "Activar"}
                                                            >
                                                                {b.is_active ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="team" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Equipo</CardTitle>
                            <CardDescription>Usuarios con acceso a este portal.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-8 items-start">
                                {/* Add Member Form */}
                                <div className="w-1/3 min-w-[300px] border-r pr-8">
                                    <h3 className="font-semibold mb-4 text-sm">Invitar Miembro</h3>
                                    <form action={handleAddMember} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Nombre</Label>
                                            <Input name="name" placeholder="Ej: Juan Pérez" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input name="email" type="email" placeholder="usuario@empresa.com" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Rol</Label>
                                            <select name="role" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                                <option value="operator">Operador (Solo Validar)</option>
                                                <option value="admin">Administrador (Gestión)</option>
                                            </select>
                                        </div>
                                        <Button type="submit" disabled={isAddingMember} className="w-full">
                                            {isAddingMember ? 'Invitando...' : <><UserPlus className="mr-2 h-4 w-4" /> Invitar</>}
                                        </Button>
                                    </form>
                                </div>

                                {/* List */}
                                <div className="flex-1">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Usuario</TableHead>
                                                <TableHead>Rol</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {team.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No hay miembros en el equipo.</TableCell>
                                                </TableRow>
                                            ) : (
                                                team.map((m) => (
                                                    <TableRow key={m.id}>
                                                        <TableCell>
                                                            <div className="font-medium">{m.invited_name || m.user_details?.full_name || 'Sin Nombre'}</div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Mail className="w-3 h-3" />
                                                                {m.invited_email || m.user_details?.email}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="capitalize">{m.role}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {m.user_id ?
                                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Registrado</Badge>
                                                                :
                                                                <Badge variant="outline" className="text-amber-600 border-amber-200">Invitado</Badge>
                                                            }
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveMember(m.id)}
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
