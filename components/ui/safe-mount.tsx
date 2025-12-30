'use client'

import { useEffect, useState } from 'react'

export default function SafeMount({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="flex flex-col gap-2 w-full max-w-md animate-pulse">
                    <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="h-[300px] bg-slate-100 rounded-lg"></div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="h-32 bg-slate-100 rounded-lg"></div>
                        <div className="h-32 bg-slate-100 rounded-lg"></div>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
