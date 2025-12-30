'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { addFamilyMember, deleteFamilyMember, getFamilyMembers } from '@/app/actions/family'

export function FamilyMembersManager({ userId }: { userId: string }) {
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        relationship: 'Child',
        rut: '',
        birth_date: ''
    })

    const fetchMembers = async () => {
        const data = await getFamilyMembers(userId)
        setMembers(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchMembers()
    }, [userId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const form = new FormData()
        form.append('full_name', formData.full_name)
        form.append('relationship', formData.relationship)
        form.append('rut', formData.rut)
        form.append('birth_date', formData.birth_date)

        const result = await addFamilyMember(userId, form)
        if (result?.error) {
            alert('Error: ' + result.error)
        } else {
            setFormData({ full_name: '', relationship: 'Child', rut: '', birth_date: '' })
            setIsAdding(false)
            fetchMembers() // Refresh list
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta carga familiar?')) return
        await deleteFamilyMember(id, userId)
        fetchMembers()
    }

    if (loading) return <div className="p-4 text-center text-gray-500">Cargando cargas familiares...</div>

    return (
        <Card className="mt-8">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Cargas Familiares
                    </CardTitle>
                    <CardDescription>Gestión de cónyuges, hijos y otras cargas.</CardDescription>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" /> Agregar
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {/* List of Members */}
                {members.length > 0 ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4 font-medium text-sm text-gray-500 pb-2 border-b">
                            <div className="col-span-4">Nombre Completo</div>
                            <div className="col-span-3">Parentesco</div>
                            <div className="col-span-3">RUT</div>
                            <div className="col-span-2 text-right">Acciones</div>
                        </div>
                        {members.map((member) => (
                            <div key={member.id} className="grid grid-cols-12 gap-4 items-center text-sm py-2 border-b last:border-0 hover:bg-gray-50 px-2 -mx-2 rounded">
                                <div className="col-span-4 font-medium">{member.full_name}</div>
                                <div className="col-span-3">
                                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                        {member.relationship === 'Spouse' ? 'Cónyuge' :
                                            member.relationship === 'Child' ? 'Hijo/a' :
                                                member.relationship === 'Parent' ? 'Padre/Madre' : member.relationship}
                                    </span>
                                </div>
                                <div className="col-span-3 font-mono text-gray-600">{member.rut || '-'}</div>
                                <div className="col-span-2 text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDelete(member.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !isAdding && <p className="text-gray-500 italic text-center py-4">No hay cargas familiares registradas.</p>
                )}

                {/* Add Form */}
                {isAdding && (
                    <div className="mt-6 bg-gray-50/50 p-6 rounded-lg border border-dashed border-gray-300">
                        <h4 className="font-semibold mb-4 text-gray-900">Nueva Carga Familiar</h4>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre Completo *</Label>
                                    <Input
                                        name="full_name"
                                        required
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="Ej: María José Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Parentesco *</Label>
                                    <select
                                        name="relationship"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.relationship}
                                        onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                                    >
                                        <option value="Spouse">Cónyuge</option>
                                        <option value="Child">Hijo/a</option>
                                        <option value="Parent">Padre/Madre</option>
                                        <option value="Other">Otro</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>RUT</Label>
                                    <Input
                                        name="rut"
                                        value={formData.rut}
                                        onChange={e => setFormData({ ...formData, rut: e.target.value })}
                                        placeholder="12.345.678-k"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha Nacimiento</Label>
                                    <Input
                                        name="birth_date"
                                        type="date"
                                        value={formData.birth_date}
                                        onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Guardando...' : 'Guardar Carga'}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
