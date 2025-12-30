'use client'

import { useState, useEffect } from 'react'
import { getBenefits, saveBenefit, toggleBenefitStatus, deleteBenefit } from '@/app/actions/benefits'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'

// Basic Modal Component (Inline for speed, usually separate)
function BenefitModal({ isOpen, onClose, benefit, onSave }: any) {
    if (!isOpen) return null

    // Form State
    const [formData, setFormData] = useState({
        provider_name: '',
        product_name: '',
        price: '',
        original_price: '',
        stock_limit: '',
        max_per_user: 2,
        image_url: ''
    })

    useEffect(() => {
        if (benefit) {
            setFormData({
                provider_name: benefit.provider_name,
                product_name: benefit.product_name,
                price: benefit.price,
                original_price: benefit.original_price || '',
                stock_limit: benefit.stock_limit || '',
                max_per_user: benefit.max_per_user || 2,
                image_url: benefit.image_url || ''
            })
        } else {
            // Reset for new
            setFormData({
                provider_name: '',
                product_name: '',
                price: '',
                original_price: '',
                stock_limit: '',
                max_per_user: 2,
                image_url: ''
            })
        }
    }, [benefit, isOpen])

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const payload = {
            ...formData,
            id: benefit?.id, // If exists
            price: Number(formData.price),
            original_price: formData.original_price ? Number(formData.original_price) : null,
            stock_limit: formData.stock_limit ? Number(formData.stock_limit) : null,
            max_per_user: Number(formData.max_per_user)
        }
        await onSave(payload)
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4">{benefit ? 'Editar Beneficio' : 'Nuevo Beneficio'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        className="w-full p-2 border rounded"
                        placeholder="Proveedor (ej. Lipigas)"
                        value={formData.provider_name}
                        onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                        required
                    />
                    <input
                        className="w-full p-2 border rounded"
                        placeholder="Producto (ej. Carga 15kg)"
                        value={formData.product_name}
                        onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="number"
                            className="w-full p-2 border rounded"
                            placeholder="Precio ($)"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                        />
                        <input
                            type="number"
                            className="w-full p-2 border rounded"
                            placeholder="Precio Original ($)"
                            value={formData.original_price}
                            onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Stock (Opcional)</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded"
                                placeholder="Infinito"
                                value={formData.stock_limit}
                                onChange={(e) => setFormData({ ...formData, stock_limit: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Límite por Socio (Mes)</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded"
                                value={formData.max_per_user}
                                onChange={(e) => setFormData({ ...formData, max_per_user: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function BenefitsPage() {
    const [benefits, setBenefits] = useState<any[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingBenefit, setEditingBenefit] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadBenefits()
    }, [])

    const loadBenefits = async () => {
        const data = await getBenefits()
        setBenefits(data)
        setLoading(false)
    }

    const handleSave = async (data: any) => {
        await saveBenefit(data)
        loadBenefits() // Refresh
    }

    const handleToggle = async (id: string, current: boolean) => {
        await toggleBenefitStatus(id, current)
        loadBenefits()
    }

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este beneficio? Esta acción no se puede deshacer.')) {
            await deleteBenefit(id)
            loadBenefits()
        }
    }

    if (loading) return <div className="p-8">Cargando catálogo...</div>

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Catálogo de Beneficios</h1>
                <Button onClick={() => { setEditingBenefit(null); setIsModalOpen(true) }} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus size={20} className="mr-2" /> Nuevo Producto
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-medium">Proveedor</th>
                            <th className="p-4 font-medium">Producto</th>
                            <th className="p-4 font-medium">Precio</th>
                            <th className="p-4 font-medium">Stock</th>
                            <th className="p-4 font-medium">Estado</th>
                            <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {benefits.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay beneficios creados.</td></tr>
                        ) : (
                            benefits.map((b) => (
                                <tr key={b.id} className="hover:bg-gray-50/50">
                                    <td className="p-4">{b.provider_name}</td>
                                    <td className="p-4 font-semibold text-gray-800">{b.product_name}</td>
                                    <td className="p-4 text-green-700 font-bold">${b.price}</td>
                                    <td className="p-4 text-gray-500">{b.stock_limit === null ? '∞' : b.stock_limit}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleToggle(b.id, b.is_active)}
                                            className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                        >
                                            {b.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            {b.is_active ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right flex gap-2 justify-end">
                                        <button onClick={() => { setEditingBenefit(b); setIsModalOpen(true) }} className="p-2 hover:bg-blue-50 text-blue-600 rounded">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(b.id)} className="p-2 hover:bg-red-50 text-red-600 rounded">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <BenefitModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                benefit={editingBenefit}
                onSave={handleSave}
            />
        </div>
    )
}
