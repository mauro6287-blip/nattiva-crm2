'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Users } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createCampaign, getAudienceSize } from '@/app/actions/marketing/campaigns'
import { useRouter } from 'next/navigation'

export default function CreateCampaignPage() {
    const router = useRouter()
    const [segment, setSegment] = useState('all')
    const [audienceCount, setAudienceCount] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Calculate Audience on Segment Change
    useEffect(() => {
        let mounted = true
        async function fetchCount() {
            setAudienceCount(null)
            // @ts-ignore
            const res = await getAudienceSize({ status: segment })
            if (mounted) setAudienceCount(res.count)
        }
        fetchCount()
        return () => { mounted = false }
    }, [segment])

    const handleSubmit = async (formData: FormData) => {
        setIsSaving(true)
        try {
            const res = await createCampaign(formData)
            if (res.error) {
                alert(res.error)
            } else {
                router.push('/dashboard/campanas')
            }
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto py-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/campanas">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Nueva Campaña</h1>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Segmentación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Segmento Objetivo</Label>
                                <select
                                    name="segment"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={segment}
                                    onChange={(e) => setSegment(e.target.value)}
                                >
                                    <option value="all">Todos los Socios</option>
                                    <option value="verified">Solo Verificados (Con RUT)</option>
                                    <option value="pending">Pendientes (Sin RUT)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-center p-4 bg-slate-50 rounded-lg border">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                                        <Users className="w-4 h-4" />
                                        <span className="text-sm font-medium">Alcance Estimado</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {audienceCount === null ? '...' : audienceCount}
                                    </div>
                                    <p className="text-xs text-muted-foreground">socios destinatarios</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2. Contenido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre de Campaña (Interno)</Label>
                            <Input name="name" placeholder="Ej: Newsletter Diciembre" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Asunto del Correo</Label>
                            <Input name="subject" placeholder="¡Noticias importantes!" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Cuerpo del Mensaje (HTML Simple)</Label>
                            <Textarea name="content" className="min-h-[200px]" placeholder="Hola {{full_name}}, ..." required />
                            <p className="text-xs text-muted-foreground">Variables disponibles: &#123;&#123;full_name&#125;&#125;, &#123;&#123;rut&#125;&#125;</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>3. Programación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Fecha de Envío (Opcional)</Label>
                            <Input type="datetime-local" name="scheduled_at" />
                            <p className="text-xs text-muted-foreground">Deja en blanco para guardar como borrador.</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/campanas">Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : <><Save className="mr-2 h-4 w-4" /> Guardar Campaña</>}
                    </Button>
                </div>
            </form>
        </div>
    )
}
