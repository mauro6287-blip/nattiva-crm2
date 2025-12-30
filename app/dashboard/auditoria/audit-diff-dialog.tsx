'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AuditDiffDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    log: any
}

export function AuditDiffDialog({ open, onOpenChange, log }: AuditDiffDialogProps) {
    if (!log) return null

    const oldValues = log.old_values || {}
    const newValues = log.new_values || {}
    const changedFields = log.changed_fields || []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Detalle de Auditoría</DialogTitle>
                    <DialogDescription>
                        Cambio detectado en <strong>{log.table_name}</strong> el {new Date(log.created_at).toLocaleString()}
                        <br />
                        Hecho por: {log.actor?.full_name || log.actor_id}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden mt-4 border rounded-md">
                    <ScrollArea className="h-[400px]">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-gray-100 text-gray-700 sticky top-0">
                                <tr>
                                    <th className="p-2 text-left border-b w-1/3">Campo</th>
                                    <th className="p-2 text-left border-b w-1/3 bg-red-50">Valor Anterior</th>
                                    <th className="p-2 text-left border-b w-1/3 bg-green-50">Valor Nuevo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {log.operation === 'INSERT' && (
                                    Object.keys(newValues).map((key) => (
                                        <tr key={key} className="border-b">
                                            <td className="p-2 font-medium">{key}</td>
                                            <td className="p-2 text-gray-400 font-mono text-xs bg-red-50/30">-</td>
                                            <td className="p-2 font-mono text-xs bg-green-50/30 text-green-700">
                                                {formatValue(newValues[key])}
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {log.operation === 'DELETE' && (
                                    Object.keys(oldValues).map((key) => (
                                        <tr key={key} className="border-b">
                                            <td className="p-2 font-medium">{key}</td>
                                            <td className="p-2 font-mono text-xs bg-red-50/30 text-red-700">
                                                {formatValue(oldValues[key])}
                                            </td>
                                            <td className="p-2 text-gray-400 font-mono text-xs bg-green-50/30">-</td>
                                        </tr>
                                    ))
                                )}

                                {log.operation === 'UPDATE' && (
                                    [...new Set([...Object.keys(oldValues), ...Object.keys(newValues)])].map((key) => {
                                        const isChanged = changedFields.includes(key);
                                        // Show all fields or only changed? Let's show all but highlight changed
                                        // User request says: "Visualizador de Cambios (Diff Viewer)"

                                        // Optimization: Only show changed fields + key identifiers (like id, title)
                                        if (!isChanged && key !== 'id' && key !== 'updated_at') return null;

                                        return (
                                            <tr key={key} className={isChanged ? "bg-yellow-50/50" : ""}>
                                                <td className="p-2 font-medium border-b relative">
                                                    {key}
                                                    {isChanged && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-yellow-400" />}
                                                </td>
                                                <td className={`p-2 font-mono text-xs border-b border-r ${isChanged ? 'bg-red-100/20 text-red-800' : 'text-gray-500'}`}>
                                                    {formatValue(oldValues[key])}
                                                </td>
                                                <td className={`p-2 font-mono text-xs border-b ${isChanged ? 'bg-green-100/20 text-green-800' : 'text-gray-500'}`}>
                                                    {formatValue(newValues[key])}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function formatValue(val: any): string {
    if (val === null || val === undefined) return 'null'
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
}
