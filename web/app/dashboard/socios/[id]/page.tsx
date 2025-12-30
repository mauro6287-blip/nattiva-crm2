'use client'

import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Missing dependency
import Link from 'next/link'
import { useEffect, useState, use } from 'react'
import { getCustomFields } from '@/app/actions/custom-fields'
import { updateSocio } from '@/app/dashboard/socios/actions'
import { ArrowLeft, Save } from 'lucide-react'
import { FamilyMembersManager } from '@/components/family-members-manager'
// import { toast } from 'sonner' // Missing dependency

export default function SocioDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [socio, setSocio] = useState<any>(null)
    const [fields, setFields] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // 1. Fetch Field Definitions
                const defs = await getCustomFields()
                setFields(defs || [])

                // 2. Fetch Socio
                const supabase = createClient()
                let { data, error } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error || !data) {
                    // Fallback to socios
                    const { data: socioData, error: socioError } = await supabase
                        .from('socios')
                        .select('*')
                        .eq('id', id)
                        .single()

                    if (socioError || !socioData) throw new Error('Socio not found')
                    data = socioData
                }
                setSocio(data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    const handleSave = async (formData: FormData) => {
        setIsSaving(true)
        try {
            const result = await updateSocio(id, null, formData)
            if (result?.error) {
                alert('Error: ' + result.error) // Simple alert for now
            } else {
                alert('Guardado exitosamente')
                // Refresh local data? The action calls revalidatePath so next router might handle it, 
                // but we are adhering to SPA feel? 
                // We'll trust revalidatePath refreshes server data, but we might need to reload window or re-fetch.
                // For now, let's just let it be.
            }
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return <div className="p-8">Loading...</div>
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>
    if (!socio) return <div className="p-8">Socio not found</div>

    // Identify orphaned keys
    const definedKeys = fields.map(f => f.field_key || f.label || `field_${f.id}`)
    const customData = socio.custom_data || {}
    const orphanedKeys = Object.keys(customData).filter(k => !definedKeys.includes(k))

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto py-8">
            <form action={handleSave} className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/dashboard/socios">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">Detalles del Socio</h1>
                    </div>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar Cambios</>}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">{socio.full_name || (socio.names + ' ' + socio.surnames)}</CardTitle>
                                <CardDescription className="uppercase font-mono mt-1">{socio.id}</CardDescription>
                            </div>
                            {socio.status ? <Badge>{socio.status}</Badge> : <Badge variant="outline">Imported</Badge>}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Email</Label>
                                <div className="text-lg">{socio.email || '-'}</div>
                            </div>
                            <div>
                                <Label>RUT / Documento</Label>
                                <div className="text-lg font-mono">{socio.rut || socio.custom_data?.rut || '-'}</div>
                            </div>
                            <div>
                                <Label>Origen</Label>
                                <div className="capitalize">{socio.metadata?.source || socio.source || 'Manual'}</div>
                            </div>
                        </div>

                        <div className="pt-6 border-t">
                            <h3 className="font-semibold mb-4 text-gray-900">Campos Personalizados</h3>

                            {/* Dynamic Fields Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {fields.map(field => {
                                    const activeKey = field.field_key || field.label || `field_${field.id}`
                                    const value = customData[activeKey] || ''
                                    const name = `custom_${activeKey}`

                                    return (
                                        <div key={field.id} className="space-y-2">
                                            <Label htmlFor={name}>{field.label}</Label>
                                            {field.data_type === 'select' ? (
                                                <select
                                                    name={name}
                                                    defaultValue={value}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {field.options && Array.isArray(field.options) && field.options.map((opt: string) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : field.data_type === 'date' ? (
                                                <Input type="date" name={name} defaultValue={value} />
                                            ) : field.data_type === 'number' ? (
                                                <Input type="number" name={name} defaultValue={value} />
                                            ) : (
                                                <Input type="text" name={name} defaultValue={value} />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {fields.length === 0 && (
                                <p className="text-gray-500 italic">No hay campos personalizados configurados.</p>
                            )}
                        </div>


                    </CardContent>
                </Card>
            </form>

            {/* Family Members Module */}
            <FamilyMembersManager userId={id as string} />
        </div>
    )
}
