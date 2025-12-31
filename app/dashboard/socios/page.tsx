import Link from 'next/link'
import { PlusCircle, Search, Settings } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DeleteSocioButton } from './delete-button'

import { SearchInput } from '@/components/dashboard/search-input'
import { getCustomFields } from '@/app/actions/custom-fields' // Import action

export const dynamic = 'force-dynamic'

export default async function SociosPage(props: {
    searchParams: Promise<{ query?: string }>
}) {
    const supabase = await createClient()
    const customFields = (await getCustomFields()) || []


    // 1. Obtener Usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect('/login')
    }

    // 2. Obtener Perfil y Tenant asociado
    const { data: profile, error: profileError } = await (supabase
        .from('user_profiles') as any)
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    console.log('[SociosPage] Debug:', {
        userId: user.id,
        profile,
        error: profileError
    })

    if (profileError || !profile?.tenant_id) {
        return (
            <div className="p-4 text-red-500 bg-red-50 rounded-md">
                <p className="font-bold">Error: Usuario no asignado a ningún sindicato (Tenant ID perdido).</p>
                <div className="text-sm mt-2 font-mono bg-red-100 p-2 rounded">
                    User: {user.id}<br />
                    Details: {profileError ? profileError.message : 'Profile found but tenant_id is null'}
                </div>
            </div>
        )
    }

    // 4. Filtrar Socios (Server-Side Search)
    const searchTerm = (await props.searchParams).query || ''

    let query = (supabase
        .from('user_profiles') as any)
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    if (searchTerm) {
        // Search in full_name and email. 
        // Note: JSONB search via 'or' in JS client can be tricky. We stick to columns for MVP stability
        // unless we want to try `custom_data->>rut.ilike.*${searchTerm}*`
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    }

    const { data: socios } = await query

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Gestión de Socios</h1>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/socios/configuracion">
                            <Settings className="mr-2 h-4 w-4" />
                            Configurar Campos
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/cargas/importar">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Importar Cargas
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/socios/import">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Carga Masiva (Socios)
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/socios/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nuevo Socio
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Afiliados</CardTitle>
                    <CardDescription>
                        Administra la base de datos de tus socios activos y pendientes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                        <SearchInput placeholder="Buscar por nombre o email..." />
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre Completo</TableHead>
                                    <TableHead>RUT / Doc</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Origen</TableHead>
                                    {/* Dynamic Custom Fields Headers */}
                                    {(customFields as any[]).map(field => (
                                        <TableHead key={field.id}>{field.label}</TableHead>
                                    ))}
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!socios || socios.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6 + customFields.length} className="h-24 text-center">
                                            No hay socios registrados aún.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (socios as any[]).map((socio) => (
                                        <TableRow key={socio.id}>
                                            <TableCell className="font-medium">
                                                {socio.full_name || 'Sin Nombre'}
                                            </TableCell>
                                            <TableCell>
                                                {/* Fallback for RUT: metadata.rut -> custom_data.rut -> '-' */}
                                                {(socio.metadata && socio.metadata['rut']) || (socio.custom_data && socio.custom_data['rut']) || '-'}
                                            </TableCell>
                                            <TableCell>{socio.email || '-'}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={socio.is_active ? 'verified' : 'pending'} />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground capitalize">
                                                {/* Fallback for Origin: metadata.source -> 'Manual' */}
                                                {(socio.metadata && socio.metadata['source']) || 'Manual'}
                                            </TableCell>
                                            {/* Dynamic Custom Fields Cells */}
                                            {(customFields as any[]).map(field => (
                                                <TableCell key={field.id}>
                                                    {socio.custom_data ? (socio.custom_data[field.field_key] || '-') : '-'}
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/dashboard/socios/${socio.id}`}>Ver</Link>
                                                    </Button>
                                                    <DeleteSocioButton id={socio.id} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function StatusBadge({ status }: { status: string | null }) {
    const styles: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
        verified: 'bg-green-100 text-green-800 hover:bg-green-100',
        ex_member: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        blocked: 'bg-red-100 text-red-800 hover:bg-red-100',
    }

    const label = status || 'unknown'
    const className = styles[label] || 'bg-gray-100 text-gray-800'

    return <Badge className={className} variant="secondary">{label}</Badge>
}
