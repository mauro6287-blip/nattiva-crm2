'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function PaymentSimulation() {
    const [generatedCode, setGeneratedCode] = useState<string | null>(null)
    const [bankBody, setBankBody] = useState('')
    const [webhookResponse, setWebhookResponse] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // User Side: Generate Order
    const handleGenerateOrder = async () => {
        setLoading(true)
        const supabase = createClient()

        // Random code gen
        const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digits
        const code = `TICKET-${randomNum}`

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            alert("No user found")
            setLoading(false)
            return
        }

        const { error } = await supabase
            .from('payment_orders')
            .insert({
                user_id: user.id,
                order_code: code,
                amount_expected: 10000,
                status: 'PENDING'
            })

        if (error) {
            alert('Error creating order: ' + error.message)
        } else {
            setGeneratedCode(code)
            // Pre-fill the bank body for convenience
            setBankBody(`Estimado cliente, se ha recibido una transferencia por $10.000 Ref: ${code} en su cuenta.`)
        }
        setLoading(false)
    }

    // Bank Side: Simulate Webhook
    const handleSimulateWebhook = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/webhooks/incoming-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: 'Notificacion de Transferencia',
                    text_body: bankBody
                })
            })
            const data = await res.json()
            setWebhookResponse(data)
        } catch (e) {
            setWebhookResponse({ error: 'Fetch failed' })
        }
        setLoading(false)
    }

    return (
        <div className="p-8 space-y-12 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800">Hito 10-B: Simulación de Pagos</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* User Side */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">1. Usuario (Cliente)</h2>
                    <p className="text-gray-600 mb-6">Genera una orden de compra pendiente para obtener un código de ticket.</p>

                    <button
                        onClick={handleGenerateOrder}
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Generar Orden ($10.000)
                    </button>

                    {generatedCode && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-center">
                            <span className="block text-sm text-blue-600 uppercase tracking-widest">Código Generado</span>
                            <span className="block text-3xl font-mono font-bold text-blue-900 mt-2">{generatedCode}</span>
                        </div>
                    )}
                </div>

                {/* Bank Side */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 text-green-600">2. Banco (Simulador)</h2>
                    <p className="text-gray-600 mb-6">Simula que llega un correo del banco confirmando la transferencia.</p>

                    <textarea
                        className="w-full h-32 p-3 border rounded-lg mb-4 font-mono text-sm bg-gray-50"
                        placeholder="Pegar cuerpo del correo aquí..."
                        value={bankBody}
                        onChange={(e) => setBankBody(e.target.value)}
                    />

                    <button
                        onClick={handleSimulateWebhook}
                        disabled={loading}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        Simular Webhook Entrante
                    </button>

                    {webhookResponse && (
                        <div className="mt-6 p-4 bg-gray-900 text-green-400 rounded-lg overflow-auto text-xs font-mono">
                            <pre>{JSON.stringify(webhookResponse, null, 2)}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
