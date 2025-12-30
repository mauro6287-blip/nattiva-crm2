'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { updateTenantConfig, getTenantConfig } from '@/app/actions/config'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Smartphone, Save } from "lucide-react"

const configSchema = z.object({
    gbAppId: z.string().min(1, "App ID es requerido"),
    gbApiKey: z.string().min(1, "API Key es requerida")
})

type ConfigData = z.infer<typeof configSchema>

export default function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    const form = useForm<ConfigData>({
        resolver: zodResolver(configSchema)
    })

    useEffect(() => {
        // Load initial config
        getTenantConfig()
            .then((res) => {
                const config = (res?.config as any) || {}
                const gb = config?.goodbarber || {}

                form.setValue('gbAppId', gb?.app_id || '')
                form.setValue('gbApiKey', gb?.api_key || '')
            })
            .catch((err) => {
                console.error("Failed to load config:", err)
            })
            .finally(() => {
                setFetching(false)
            })
    }, [form])

    const onSubmit = async (data: ConfigData) => {
        setLoading(true)
        try {
            const payload = {
                goodbarber: {
                    app_id: data.gbAppId,
                    api_key: data.gbApiKey
                }
            }
            const res = await updateTenantConfig(payload)
            if (res.error) {
                alert('Error: ' + res.error)
            } else {
                alert('Configuración guardada exitosamente')
            }
        } catch (e: any) {
            console.error("Submit Error:", e)
            alert(`Error al guardar: ${e.message || 'Error desconocido'}`)
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configuración</h1>
                <p className="text-slate-500">Administra las integraciones y preferencias de tu sindicato.</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Smartphone className="h-5 w-5" />
                            </div>
                            <CardTitle>Conexión App Móvil (Nattiva)</CardTitle>
                        </div>
                        <CardDescription>
                            Ingresa las credenciales API de tu aplicación Nattiva para habilitar notificaciones Push y sincronización de usuarios.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>App ID</Label>
                                <Input {...form.register('gbAppId')} placeholder="Ej: 123456" />
                                {form.formState.errors.gbAppId && <p className="text-red-500 text-xs">{form.formState.errors.gbAppId.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>API Key (Secreta)</Label>
                                <Input {...form.register('gbApiKey')} type="password" placeholder="••••••••••••••••" />
                                <p className="text-xs text-slate-400">Esta llave se usará para autenticar peticiones desde el CRM hacia Nattiva.</p>
                                {form.formState.errors.gbApiKey && <p className="text-red-500 text-xs">{form.formState.errors.gbApiKey.message}</p>}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50 border-t p-4 flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Configuración
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
