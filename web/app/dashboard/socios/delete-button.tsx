'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteSocio } from './actions'
import { useState } from 'react'

export function DeleteSocioButton({ id, className }: { id: string, className?: string }) {
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro que deseas eliminar este socio? Esta acción no se puede deshacer.')) {
            return
        }

        setLoading(true)
        try {
            const res = await deleteSocio(id)
            if (res.error) {
                alert(res.error)
            } else {
                // Success - handled by revalidatePath in action
            }
        } catch (e) {
            alert('Error desconocido al eliminar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
            className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${className}`}
        >
            <Trash2 className="h-4 w-4 mr-1" />
            {loading ? '...' : 'Eliminar'}
        </Button>
    )
}
