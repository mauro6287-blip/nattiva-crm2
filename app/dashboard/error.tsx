'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="bg-red-100 p-3 rounded-full">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                    Ups, algo salió mal en el panel
                </h2>
                <p className="text-sm text-slate-500 max-w-sm">
                    No pudimos cargar algunos datos. Esto puede deberse a una interrupción momentánea de red.
                </p>
            </div>
            <Button onClick={() => reset()} variant="outline">
                Intentar nuevamente
            </Button>
        </div>
    )
}
