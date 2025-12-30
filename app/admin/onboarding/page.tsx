'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { provisionTenant } from '@/app/actions/provisioning'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, Factory } from "lucide-react"

// --- Schemas ---
const step1Schema = z.object({
    name: z.string().min(3, "Nombre muy corto"),
    slug: z.string().min(3, "Slug muy corto").regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
    color: z.string().optional()
})

const step2Schema = z.object({
    adminName: z.string().min(3, "Requiere nombre completo"),
    adminEmail: z.string().email("Email inválido"),
    // Configs hardcoded defaults in form or handled in logic
    seedCategories: z.boolean().default(true),
    seedMacros: z.boolean().default(true),
    demoData: z.boolean().default(false)
})

type FormData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema>

export default function OnboardingWizard() {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const form = useForm<FormData>({
        resolver: zodResolver(step === 1 ? step1Schema : step2Schema) as any,
        defaultValues: {
            seedCategories: true,
            seedMacros: true,
            demoData: false
        }
    })

    const onSubmit = async (data: FormData) => {
        if (step === 1) {
            setStep(2)
            return
        }

        // Final Submit
        setLoading(true)
        // CRITICAL FIX: Use getValues() to ensure we retrieve data from Step 1 (which might be filtered out by Step 2 resolver)
        const allData = form.getValues()

        const payload = {
            tenant: {
                name: allData.name,
                slug: allData.slug,
                color: allData.color
            },
            admin: {
                name: allData.adminName,
                email: allData.adminEmail
            },
            config: {
                seedCategories: allData.seedCategories,
                seedMacros: allData.seedMacros,
                demoData: allData.demoData
            }
        }

        try {
            const res = await provisionTenant(payload)
            if (res.error) {
                alert('Error: ' + res.error)
            } else {
                setResult(res.credentials)
            }
        } catch (e: any) {
            alert('Critical Error: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    if (result) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
                <Card className="max-w-md w-full border-green-200 bg-green-50">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-green-700 mb-2">
                            <CheckCircle2 className="h-6 w-6" />
                            <span className="font-bold text-lg">¡Sindicato Desplegado!</span>
                        </div>
                        <CardTitle>{form.getValues('name')}</CardTitle>
                        <CardDescription>El entorno ha sido aprovisionado exitosamente.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-white p-4 rounded border border-green-100 shadow-sm">
                            <h3 className="font-semibold text-sm mb-2 text-slate-700">Credenciales Admin</h3>
                            <div className="text-sm grid grid-cols-[80px_1fr] gap-2">
                                <span className="text-slate-500">URL:</span>
                                <span className="font-mono text-blue-600 break-all">{result.loginUrl}</span>

                                <span className="text-slate-500">Email:</span>
                                <span className="font-medium">{result.email}</span>

                                <span className="text-slate-500">Pass:</span>
                                <span className="font-mono bg-slate-100 px-1 rounded">{result.password}</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Copia estas credenciales. No se volverán a mostrar.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => window.location.reload()}>
                            Aprovisionar Otro
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
            <div className="mb-8 text-center">
                <div className="bg-white p-3 rounded-full inline-block shadow-sm mb-4">
                    <Factory className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Fábrica de Tenants</h1>
                <p className="text-slate-500">Asistente de Aprovisionamiento v1.0</p>
            </div>

            <Card className="max-w-lg w-full">
                <CardHeader>
                    <CardTitle>Paso {step} de 2: {step === 1 ? 'Identidad Corporativa' : 'Acceso y Configuración'}</CardTitle>
                    <CardDescription>
                        {step === 1 ? 'Define los datos básicos del sindicato.' : 'Crea el usuario administrador y define los datos semilla.'}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={form.handleSubmit(onSubmit as any)}>
                    <CardContent className="space-y-4">
                        {step === 1 && (
                            <>
                                <div className="space-y-2">
                                    <Label>Nombre del Sindicato</Label>
                                    <Input {...form.register('name')} placeholder="Ej: Sindicato Banco Chile" />
                                    {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Slug (URL Identifier)</Label>
                                    <Input {...form.register('slug')} placeholder="ej: sin-banco-chile" />
                                    <p className="text-xs text-slate-400">Usado para rutas y subdominios.</p>
                                    {form.formState.errors.slug && <p className="text-red-500 text-xs">{form.formState.errors.slug.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Color de Marca (Opcional)</Label>
                                    <div className="flex gap-2">
                                        <Input {...form.register('color')} type="color" className="w-12 h-10 p-1" defaultValue="#0f172a" />
                                        <Input {...form.register('color')} placeholder="#000000" className="flex-1" />
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="space-y-2">
                                    <Label>Nombre Admin Principal</Label>
                                    <Input {...form.register('adminName')} placeholder="Juan Pérez" />
                                    {form.formState.errors.adminName && <p className="text-red-500 text-xs">{form.formState.errors.adminName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Corporativo (Login)</Label>
                                    <Input {...form.register('adminEmail')} type="email" placeholder="admin@sindicato.cl" />
                                    {form.formState.errors.adminEmail && <p className="text-red-500 text-xs">{form.formState.errors.adminEmail.message}</p>}
                                </div>

                                <div className="pt-4 space-y-3">
                                    <h3 className="font-medium text-sm text-slate-700">Aprovisionamiento de Datos</h3>

                                    <div className="flex items-center space-x-2 border p-3 rounded bg-slate-50">
                                        <Checkbox
                                            id="seedCategories"
                                            checked={form.watch('seedCategories')}
                                            onCheckedChange={(c) => form.setValue('seedCategories', c as boolean)}
                                        />
                                        <label htmlFor="seedCategories" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Categorías Estándar (SLA)
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2 border p-3 rounded bg-slate-50">
                                        <Checkbox
                                            id="seedMacros"
                                            checked={form.watch('seedMacros')}
                                            onCheckedChange={(c) => form.setValue('seedMacros', c as boolean)}
                                        />
                                        <label htmlFor="seedMacros" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Macros de Respuesta
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2 border p-3 rounded bg-blue-50 border-blue-100">
                                        <Checkbox
                                            id="demoData"
                                            checked={form.watch('demoData')}
                                            onCheckedChange={(c) => form.setValue('demoData', c as boolean)}
                                        />
                                        <label htmlFor="demoData" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-blue-700">
                                            <span className="font-bold">Modo Demo</span> (Inyectar usuarios y tickets falsos)
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        {step === 2 && (
                            <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={loading}>
                                Atrás
                            </Button>
                        )}
                        <Button type="submit" disabled={loading} className={step === 1 ? "w-full" : "ml-auto"}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {step === 1 ? 'Siguiente: Acceso' : 'Desplegar Sindicato 🚀'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
