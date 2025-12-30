'use client'

import { signOut } from '@/app/dashboard/actions'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

export function Header({ userEmail }: { userEmail: string | undefined }) {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-white px-6 justify-between lg:h-[60px]">
            <div className="w-full flex-1">
                <h1 className="text-lg font-semibold md:text-xl text-gray-800">Panel de Control</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline font-medium">{userEmail}</span>
                </div>
                <form action={signOut}>
                    <Button variant="ghost" size="icon" title="Cerrar Sesión" className="text-gray-500 hover:text-red-600">
                        <LogOut className="h-5 w-5" />
                        <span className="sr-only">Cerrar Sesión</span>
                    </Button>
                </form>
            </div>
        </header>
    )
}
