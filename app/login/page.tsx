import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Building2, Lock, Mail } from 'lucide-react'

export default async function LoginPage(props: {
    searchParams: Promise<{ message: string }>
}) {
    const searchParams = await props.searchParams
    const message = searchParams.message

    // Check for critical configuration errors
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const configError = !supabaseUrl
        ? "Error de Configuración: La URL de Supabase no ha sido inyectada. Contacte al administrador."
        : null

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">CRM Sindicatos</CardTitle>
                    <CardDescription>
                        Ingresa a tu cuenta para administrar tu sindicato
                    </CardDescription>
                </CardHeader>
                <form action={login}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@sindicato.cl"
                                    className="pl-9"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-9"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col">
                        <Button className="w-full">Ingresar</Button>
                        {configError && (
                            <p className="mt-4 p-4 bg-yellow-100 text-yellow-800 text-center rounded-md text-sm font-bold border border-yellow-300">
                                {configError}
                            </p>
                        )}
                        {message && !configError && (
                            <p className="mt-4 p-4 bg-red-100 text-red-700 text-center rounded-md text-sm">
                                {message}
                            </p>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
