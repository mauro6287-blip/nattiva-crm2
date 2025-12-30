'use client'

import { useState, useEffect } from 'react'
import { getCustomFields, saveCustomField, deleteCustomField } from '@/app/actions/custom-fields'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

// Simple Modal specific for this
function FieldModal({ isOpen, onClose, onSave, initialData }: any) {
    if (!isOpen) return null

    // State initialization
    const [label, setLabel] = useState('')
    const [type, setType] = useState('text')
    const [required, setRequired] = useState(false)
    const [options, setOptions] = useState('') // Comma separated

    // Identify if we are editing
    const isEditing = !!initialData

    // Reset or populate form when modal opens
    useEffect(() => {
        if (initialData) {
            setLabel(initialData.label)
            setType(initialData.data_type)
            setRequired(initialData.is_required || false) // is_active? organization_fields usually defaults is_required logic to app level or assumes optional. The schema didn't have is_required. 
            // organization_fields schema: id, tenant_id, field_key, label, data_type, options, is_active.
            // It seems I missed `is_required` in the migration! 
            // The prompt "Create Table (SQL)" listed: field_key, label, data_type, options, is_active. NO is_required.
            // So I should probably remove is_required from UI or add it to table. 
            // Prompt says: "Create Table ... is_active". No mentioning of required.
            // I will assume for now it is NOT required at DB level. I will remove the checkbox or keep it and ignore it?
            // "Enable full CRUD...". If I remove it, I simplify.
            // I'll leave the UI for now but it won't persist unless I add the column. 
            // The user didn't ask for is_required. I'll drop it to match spec.
            setOptions(initialData.options ? initialData.options.join(', ') : '')
        } else {
            setLabel('')
            setType('text')
            setRequired(false)
            setOptions('')
        }
    }, [initialData, isOpen])

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const payload = {
            id: initialData?.id, // Include ID if editing
            label,
            data_type: type,
            // is_required: required, // Dropping support as per schema
            options: type === 'select' ? options : null
        }
        await onSave(payload)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <h3 className="text-lg font-bold mb-4">{isEditing ? 'Editar Campo' : 'Nuevo Campo Personalizado'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nombre del Campo (Label)</label>
                        <input className="w-full p-2 border rounded" value={label} onChange={e => setLabel(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Tipo de Dato</label>
                        <select className="w-full p-2 border rounded" value={type} onChange={e => setType(e.target.value)}>
                            <option value="text">Texto</option>
                            <option value="number">Número</option>
                            <option value="date">Fecha</option>
                            <option value="select">Lista Desplegable (Select)</option>
                        </select>
                    </div>

                    {type === 'select' && (
                        <div>
                            <label className="block text-sm font-medium">Opciones (separadas por coma)</label>
                            <input
                                className="w-full p-2 border rounded"
                                placeholder="Opción A, Opción B, Opción C"
                                value={options}
                                onChange={e => setOptions(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {/* <div className="flex items-center gap-2">
                        <input type="checkbox" id="req" checked={required} onChange={e => setRequired(e.target.checked)} />
                        <label htmlFor="req" className="text-sm">¿Es Obligatorio?</label>
                    </div> */}

                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                            {isEditing ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function ConfigPropsPage() {
    const [fields, setFields] = useState<any[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingField, setEditingField] = useState<any>(null)

    useEffect(() => {
        loadFields()
    }, [])

    const loadFields = async () => {
        const data = await getCustomFields()
        setFields(data)
    }

    const handleCreate = () => {
        setEditingField(null)
        setIsModalOpen(true)
    }

    const handleEdit = (field: any) => {
        setEditingField(field)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar este campo? Los datos existentes en los socios no se borrarán, pero el campo dejará de aparecer.')) {
            await deleteCustomField(id)
            loadFields()
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Configuración de Campos</h1>
                <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Agregar Campo</Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                        <tr>
                            <th className="p-4">Clave (Key)</th>
                            <th className="p-4">Nombre</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Opciones</th>
                            <th className="p-4">Requerido</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {fields.length === 0 ? (
                            <tr><td colSpan={5} className="p-6 text-center text-gray-400">No hay campos personalizados definidos.</td></tr>
                        ) : (
                            fields.map(f => (
                                <tr key={f.id}>
                                    <td className="p-4 text-xs font-mono text-gray-500">{f.field_key}</td>
                                    <td className="p-4 font-medium">{f.label}</td>
                                    <td className="p-4 capitalize">{f.data_type}</td>
                                    <td className="p-4 text-gray-500">{f.options ? (Array.isArray(f.options) ? f.options.join(', ') : JSON.stringify(f.options)) : '-'}</td>
                                    {/* <td className="p-4">{f.is_required ? 'Sí' : 'No'}</td> */}
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleEdit(f)}
                                            className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded border border-blue-200 text-xs font-medium"
                                            title="Editar Campo"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(f.id)}
                                            className="text-red-600 hover:bg-red-50 px-3 py-1 rounded border border-red-200 text-xs font-medium"
                                            title="Eliminar Campo"
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <FieldModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={editingField}
                onSave={async (data: any) => { await saveCustomField(data); loadFields(); }}
            />
        </div>
    )
}
