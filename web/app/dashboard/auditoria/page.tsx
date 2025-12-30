'use client'

import { useState, useEffect } from 'react'
import { getAuditLogs } from '@/app/actions/audit'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AuditDiffDialog } from './audit-diff-dialog'
import { Search, Filter, ShieldCheck, Download } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"

export default function AuditPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        operation: 'ALL',
        table: ''
    })
    const [selectedLog, setSelectedLog] = useState<any>(null)
    const [diffOpen, setDiffOpen] = useState(false)

    useEffect(() => {
        fetchLogs()
    }, [filters])

    async function fetchLogs() {
        setLoading(true)
        const data = await getAuditLogs({
            operation: filters.operation === 'ALL' ? undefined : filters.operation,
            table: filters.table || undefined,
            limit: 100
        })
        setLogs(data || [])
        setLoading(false)
    }

    function handleOpenDiff(log: any) {
        setSelectedLog(log)
        setDiffOpen(true)
    }

    // Mock Export Function
    function handleExport() {
        if (!logs.length) return

        // Convert logs to CSV string (simplified)
        const headers = ['ID', 'Date', 'Actor', 'Action', 'Table', 'Details']
        const rows = logs.map(l => [
            l.id,
            l.created_at,
            l.actor?.email || l.actor_id,
            l.operation,
            l.table_name,
            `Changed: ${l.changed_fields?.join(', ')}`
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit_logs_${new Date().toISOString()}.csv`
        a.click()
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-blue-600" />
                        Auditoría Forense
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Registro inmutable de seguridad y cumplimiento normativo.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={loading || logs.length === 0}>
                        <Download className="mr-2 h-4 w-4" /> Exportar CSV
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Select
                                value={filters.operation}
                                onValueChange={(v) => setFilters(prev => ({ ...prev, operation: v }))}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Tipo de Operación" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todas las Operaciones</SelectItem>
                                    <SelectItem value="INSERT">Creación (INSERT)</SelectItem>
                                    <SelectItem value="UPDATE">Edición (UPDATE)</SelectItem>
                                    <SelectItem value="DELETE">Eliminación (DELETE)</SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                placeholder="Filtrar por tabla (ej: tickets)"
                                value={filters.table}
                                onChange={(e) => setFilters(prev => ({ ...prev, table: e.target.value }))}
                                className="w-[200px]"
                            />
                            <Button variant="ghost" onClick={fetchLogs} size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Fecha / Hora</TableHead>
                                <TableHead className="w-[200px]">Actor (Usuario)</TableHead>
                                <TableHead className="w-[100px]">Evento</TableHead>
                                <TableHead>Entidad (Tabla)</TableHead>
                                <TableHead>Cambios</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Cargando logs de seguridad...
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No se encontraron registros de auditoría.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow
                                        key={log.id}
                                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={() => handleOpenDiff(log)}
                                    >
                                        <TableCell className="font-mono text-xs text-slate-500">
                                            {new Date(log.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{log.actor?.full_name || 'Desconocido'}</span>
                                                <span className="text-xs text-muted-foreground">{log.actor?.email || log.actor_id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <BadgeOperation op={log.operation} />
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-700">
                                            {log.table_name}
                                            <span className="ml-2 text-xs text-slate-400 font-mono">#{log.record_id.slice(0, 8)}</span>
                                        </TableCell>
                                        <TableCell>
                                            {log.operation === 'UPDATE' && log.changed_fields?.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {log.changed_fields.map((f: string) => (
                                                        <span key={f} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                    {log.operation === 'INSERT' ? 'Registro nuevo' : 'Registro eliminado'}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={(e) => {
                                                e.stopPropagation()
                                                handleOpenDiff(log)
                                            }}>
                                                Ver Detalles
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AuditDiffDialog
                open={diffOpen}
                onOpenChange={setDiffOpen}
                log={selectedLog}
            />
        </div>
    )
}

function BadgeOperation({ op }: { op: string }) {
    const styles = {
        INSERT: "bg-green-100 text-green-700 border-green-200",
        UPDATE: "bg-blue-100 text-blue-700 border-blue-200",
        DELETE: "bg-red-100 text-red-700 border-red-200"
    }[op] || "bg-gray-100 text-gray-700"

    const labels = {
        INSERT: "CREACIÓN",
        UPDATE: "EDICIÓN",
        DELETE: "ELIMINACIÓN"
    }[op] || op

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles}`}>
            {labels}
        </span>
    )
}
