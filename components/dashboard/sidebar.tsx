'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, CreditCard, Heart, Building2, FileText, MessageSquare, BarChart, Megaphone, Building, Ticket, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
    {
        title: 'Inicio',
        href: '/dashboard',
        icon: Home,
    },
    {
        title: 'Socios',
        href: '/dashboard/socios',
        icon: Users,
    },
    {
        title: 'Cuotas',
        href: '/dashboard/cuotas',
        icon: CreditCard,
    },
    {
        title: 'Beneficios',
        href: '/dashboard/beneficios',
        icon: Heart,
    },
    {
        title: 'Contenidos',
        href: '/dashboard/contenidos',
        icon: FileText,
    },
    {
        title: 'Mesa de Ayuda',
        href: '/dashboard/tickets',
        icon: MessageSquare,
    },
    {
        title: 'Analítica',
        href: '/dashboard/analisis',
        icon: BarChart,
    },
    {
        title: 'Campañas',
        href: '/dashboard/campanas',
        icon: Megaphone,
    },
    {
        title: 'Proveedores',
        href: '/dashboard/proveedores',
        icon: Building,
    },
    // Tickets removed as redundant (Mesa de Ayuda exists)
    {
        title: 'Auditoría',
        href: '/dashboard/auditoria',
        icon: FileText, // Using FileText temporarily, or Shield if available
    },
    {
        title: 'Configuración',
        href: '/dashboard/configuracion',
        icon: Settings,
    },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <nav className="hidden border-r bg-muted/40 md:block w-64 flex-col h-full bg-white">
            <div className="flex h-14 items-center border-b px-6">
                <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
                    <Building2 className="h-6 w-6 text-primary" />
                    <span className="">CRM Sindicatos</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <ul className="grid items-start px-4 text-sm font-medium gap-1">
                    {items.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                        isActive
                                            ? "bg-slate-100 text-primary font-semibold"
                                            : "text-muted-foreground hover:bg-slate-50"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.title}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </nav>
    )
}
