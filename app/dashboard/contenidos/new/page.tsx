'use client'

import { useActionState } from "react"
import { createContent } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import Link from "next/link"

const initialState = {
    error: '',
}

export default function NewContentPage() {
    const [state, formAction, isPending] = useActionState(createContent, initialState)

    return (
        <div className="max-w-4xl mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Crear Nuevo Contenido</CardTitle>
                    <CardDescription>
                        Redacte su artículo para la App Móvil. Puede guardarlo como borrador o enviarlo a revisión.
                    </CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        {state?.error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                                {state.error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title">Título *</Label>
                            <Input id="title" name="title" placeholder="Título del artículo" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="summary">Resumen (Bajada)</Label>
                            <Textarea id="summary" name="summary" placeholder="Breve descripción que aparecerá en el listado..." rows={3} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Categoría</Label>
                                <Input id="category" name="category" placeholder="Ej: Noticias, Beneficios, Eventos" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="thumbnail_url">URL Imagen Principal</Label>
                                <Input id="thumbnail_url" name="thumbnail_url" placeholder="https://..." />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content_html">Contenido (HTML) *</Label>
                            <Textarea
                                id="content_html"
                                name="content_html"
                                placeholder="<p>Escriba aquí el contenido del artículo...</p>"
                                className="font-mono text-sm"
                                rows={15}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Puede escribir HTML básico (p, strong, ul, li, etc.) para dar formato.
                            </p>
                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-between items-center bg-gray-50/50 p-6">
                        <Button variant="ghost" asChild>
                            <Link href="/dashboard/contenidos">Cancelar</Link>
                        </Button>
                        <div className="flex gap-2">
                            <Button type="submit" name="action" value="save_draft" variant="outline" disabled={isPending}>
                                Guardar Borrador
                            </Button>
                            <Button type="submit" name="action" value="submit" disabled={isPending}>
                                {isPending ? 'Enviando...' : 'Enviar a Revisión'}
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
