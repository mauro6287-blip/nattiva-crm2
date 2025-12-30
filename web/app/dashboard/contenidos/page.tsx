import Link from 'next/link'
import { PlusCircle, CheckCircle, XCircle } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ReviewForm } from './review-form'

export default async function ContenidosPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get User Role
    const { data: profile } = await (supabase
        .from('user_profiles') as any)
        .select('*, roles(code)')
        .eq('id', user.id)
        .single()

    const roleCode = profile?.roles?.code || 'provider'
    const isAdmin = roleCode === 'admin'

    // Fetch lists
    // 1. Inbox (Admin only): status = 'enviado'
    let inboxItems = []
    if (isAdmin) {
        const { data } = await (supabase
            .from('content_items') as any)
            .select('*')
            .eq('status', 'enviado')
            .order('created_at', { ascending: true })
        inboxItems = data || []
    }

    // 2. My Content (Everyone)
    const { data: myItems } = await (supabase
        .from('content_items') as any)
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Gestión de Contenidos</h1>
                <Button asChild>
                    <Link href="/dashboard/contenidos/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Contenido
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue={isAdmin && inboxItems.length > 0 ? "inbox" : "my_content"}>
                <TabsList>
                    {isAdmin && <TabsTrigger value="inbox">Bandeja de Entrada ({inboxItems.length})</TabsTrigger>}
                    <TabsTrigger value="my_content">Mis Contenidos</TabsTrigger>
                </TabsList>

                {/* ADMIN INBOX */}
                {isAdmin && (
                    <TabsContent value="inbox">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pendientes de Revisión</CardTitle>
                                <CardDescription>Contenidos enviados por proveedores esperando aprobación.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Título</TableHead>
                                            <TableHead>Autor</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!inboxItems.length ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24">No hay tareas pendientes.</TableCell>
                                            </TableRow>
                                        ) : (
                                            (inboxItems as any[]).map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">
                                                        {item.title}
                                                        <div className="text-xs text-muted-foreground truncate max-w-[300px]">{item.summary}</div>
                                                    </TableCell>
                                                    <TableCell>{item.author_name}</TableCell>
                                                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <ReviewForm contentId={item.id} />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* MY CONTENT */}
                <TabsContent value="my_content">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mis Publicaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Info</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!myItems || myItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">Aún no has creado contenidos.</TableCell>
                                        </TableRow>
                                    ) : (
                                        (myItems as any[]).map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.title}</TableCell>
                                                <TableCell><StatusBadge status={item.status} /></TableCell>
                                                <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        {/* Link to edit/view page if implemented */}
                                                        <span className="text-xs text-muted-foreground">ID: {item.id.slice(0, 8)}</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        borrador: 'bg-gray-100 text-gray-800',
        enviado: 'bg-yellow-100 text-yellow-800',
        publicado: 'bg-green-100 text-green-800',
        rechazado: 'bg-red-100 text-red-800',
        archivado: 'bg-gray-100 text-gray-500',
    }
    return <Badge className={styles[status] || 'bg-gray-100'}>{status}</Badge>
}
