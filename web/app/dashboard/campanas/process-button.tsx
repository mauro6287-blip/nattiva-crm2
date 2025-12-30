'use client'

import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { processCampaignMock } from '@/app/actions/marketing/campaigns'

export function ProcessCampaignButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false)

    const handleProcess = async () => {
        if (!confirm('¿Simular envío de esta campaña?')) return
        setLoading(true)
        try {
            const res = await processCampaignMock(id)
            if (res.error) alert(res.error)
            else alert(`Envío simulado exitoso a ${res.count} usuarios.`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button size="sm" variant="secondary" onClick={handleProcess} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Enviar Ahora
        </Button>
    )
}
