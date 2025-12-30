'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card' // Assuming these exist or using raw div if not
import { DollarSign, AlertTriangle, Clock } from 'lucide-react'

// Simple formatter
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

export default function FinancialDashboard() {
    const [stats, setStats] = useState({ paid: 0, pending: 0, orphan: 0 })
    const [orphans, setOrphans] = useState<any[]>([])
    const [recent, setRecent] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const supabase = createClient()

        // 1. KPIs
        // Total Recaudado (PAID)
        const { data: paidOrders } = await supabase.from('payment_orders').select('amount_expected').eq('status', 'PAID')
        const totalPaid = paidOrders?.reduce((acc, curr) => acc + (curr.amount_expected || 0), 0) || 0

        // Por Cobrar (PENDING)
        const { data: pendingOrders } = await supabase.from('payment_orders').select('amount_expected').eq('status', 'PENDING')
        const totalPending = pendingOrders?.reduce((acc, curr) => acc + (curr.amount_expected || 0), 0) || 0

        // Orphans
        const { count: orphanCount } = await supabase.from('payment_audit_logs').select('*', { count: 'exact', head: true }).eq('status', 'ORPHAN')

        setStats({ paid: totalPaid, pending: totalPending, orphan: orphanCount || 0 })

        // 2. Orphan List
        const { data: orphanList } = await supabase
            .from('payment_audit_logs')
            .select('*')
            .eq('status', 'ORPHAN')
            .order('received_at', { ascending: false })

        setOrphans(orphanList || [])

        // 3. Recent Transactions
        const { data: recentList } = await supabase
            .from('payment_orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        setRecent(recentList || [])
        setLoading(false)
    }

    if (loading) return <div className="p-8">Cargando Finanzas...</div>

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Panel Financiero</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Total Recaudado</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-full">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Por Cobrar</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.pending)}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <Clock size={24} />
                    </div>
                </div>

                <div className={`p-6 rounded-xl shadow-sm border flex items-center justify-between ${stats.orphan > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                    <div>
                        <p className={`text-sm mb-1 ${stats.orphan > 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>⚠️ POR REVISAR</p>
                        <p className={`text-2xl font-bold ${stats.orphan > 0 ? 'text-red-700' : 'text-gray-400'}`}>{stats.orphan}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stats.orphan > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                        <AlertTriangle size={24} />
                    </div>
                </div>
            </div>

            {/* Main Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Orphan List (Review Tray) */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-500" />
                        Pagos Sin Identificar (Requiere Revisión Manual)
                    </h2>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Asunto</th>
                                    <th className="p-4">Contenido (Preview)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orphans.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-gray-400">
                                            No hay pagos pendientes de revisión.
                                        </td>
                                    </tr>
                                ) : (
                                    orphans.map((orphan) => (
                                        <tr key={orphan.id} className="hover:bg-red-50/30 transition">
                                            <td className="p-4 text-gray-600">{new Date(orphan.received_at).toLocaleDateString()}</td>
                                            <td className="p-4 font-medium text-gray-800">{orphan.email_subject || 'Sin Asunto'}</td>
                                            <td className="p-4 text-gray-500 truncate max-w-xs">{orphan.email_body}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">Transacciones Recientes</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {recent.map((order) => (
                                <div key={order.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-900">{order.order_code}</p>
                                        <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-700">{formatCurrency(order.amount_expected)}</p>
                                        <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
