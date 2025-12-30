'use client'

import { useState, useEffect } from 'react'
import { uploadCSV, validateBatch, commitBatch, getBatchSummary, getBatchRows } from '@/app/actions/import-socios'
import { getCustomFields } from '@/app/actions/custom-fields'

export default function ImportSociosPage() {
    const [step, setStep] = useState(1) // 1: Upload, 2: Review, 3: Done
    const [batchId, setBatchId] = useState<string | null>(null)
    const [summary, setSummary] = useState<any>(null)
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [customFields, setCustomFields] = useState<any[]>([])

    useEffect(() => {
        getCustomFields().then(setCustomFields)
    }, [])

    // Step 1: Upload
    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        // ... keeping existing code until render ...


        const formData = new FormData(e.currentTarget)
        const res = await uploadCSV(formData)

        if (res.error) {
            setError(res.error)
            setLoading(false)
            return
        }

        if (res.batchId) {
            setBatchId(res.batchId)
            // Trigger validation immediately
            fetchValidation(res.batchId)
        }
    }

    const fetchValidation = async (id: string) => {
        setLoading(true)
        // Run validation logic on server
        await validateBatch(id)

        // Fetch results
        const sum = await getBatchSummary(id)
        const rowData = await getBatchRows(id)

        setSummary(sum)
        setRows(rowData)
        setStep(2)
        setLoading(false)
    }

    // Step 2: Commit
    const handleCommit = async () => {
        if (!batchId) return
        setLoading(true)
        const res = await commitBatch(batchId)
        setLoading(false)

        if (res.error) {
            setError(res.error)
        } else {
            setStep(3)
        }
    }

    return (
        <div className="p-8 max-w-5xl mx-auto bg-slate-50 min-h-screen">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Importar Socios</h1>
            <p className="text-slate-500 mb-8">Asistente de Importación y Transformación de Datos</p>

            {/* Steps Indicator */}
            <div className="flex items-center space-x-4 mb-8 text-sm">
                <div className={`px-4 py-2 rounded-full font-bold ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1. Cargar CSV</div>
                <div className="h-0.5 w-8 bg-slate-300"></div>
                <div className={`px-4 py-2 rounded-full font-bold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2. Revisar y Validar</div>
                <div className="h-0.5 w-8 bg-slate-300"></div>
                <div className={`px-4 py-2 rounded-full font-bold ${step === 3 ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3. Finalizado</div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-6 border border-red-200 flex items-center">
                    <span className="text-xl mr-2">🚨</span> {error}
                </div>
            )}

            {/* Step 1: Upload */}
            {step === 1 && (
                <div className="bg-white p-10 rounded-xl shadow-sm border border-dashed border-slate-300 text-center">
                    <form onSubmit={handleUpload} className="space-y-6">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl">📂</div>
                            <h2 className="text-xl font-semibold text-slate-700">Arrastra y suelta tu CSV aquí</h2>
                            <p className="text-sm text-slate-400">Encabezados requeridos: Nombres, Apellidos, RUT, Email</p>

                            <input type="file" name="file" accept=".csv" required className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                            "/>
                        </div>
                        <button disabled={loading} type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow disabled:opacity-50">
                            {loading ? 'Procesando...' : 'Cargar y Validar'}
                        </button>
                    </form>
                </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && summary && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                            <div className="text-slate-500 text-xs uppercase font-bold">Filas Totales</div>
                            <div className="text-3xl font-bold text-slate-800">{summary.total}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
                            <div className="text-green-600 text-xs uppercase font-bold">✅ Listos para Importar</div>
                            <div className="text-3xl font-bold text-green-800">{summary.valid}</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
                            <div className="text-yellow-600 text-xs uppercase font-bold">⚠️ Duplicados (Espera)</div>
                            <div className="text-3xl font-bold text-yellow-800">{summary.duplicate}</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200">
                            <div className="text-red-600 text-xs uppercase font-bold">❌ Errores (Omitidos)</div>
                            <div className="text-3xl font-bold text-red-800">{summary.error}</div>
                        </div>
                    </div>

                    {/* Preview Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs uppercase text-slate-500 font-bold">Estado</th>
                                    <th className="px-6 py-3 text-xs uppercase text-slate-500 font-bold">Nombre</th>
                                    <th className="px-6 py-3 text-xs uppercase text-slate-500 font-bold">RUT</th>
                                    <th className="px-6 py-3 text-xs uppercase text-slate-500 font-bold">Email</th>
                                    {customFields.map(f => (
                                        <th key={f.id} className="px-6 py-3 text-xs uppercase text-purple-600 font-bold">{f.label}</th>
                                    ))}
                                    <th className="px-6 py-3 text-xs uppercase text-slate-500 font-bold">Mensaje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {rows.map((r: any) => (
                                    <tr key={r.id} className={r.status === 'ERROR' ? 'bg-red-50' : r.status === 'DUPLICATE' ? 'bg-yellow-50' : ''}>
                                        <td className="px-6 py-3">
                                            {r.status === 'VALID' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">VALIDO</span>}
                                            {r.status === 'ERROR' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">ERROR</span>}
                                            {r.status === 'DUPLICATE' && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">DUPLICADO</span>}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-slate-700">{r.raw_data.names} {r.raw_data.surnames}</td>
                                        <td className="px-6 py-3 font-mono text-slate-500">{r.raw_data.rut}</td>
                                        <td className="px-6 py-3 text-slate-500">{r.raw_data.email}</td>
                                        {customFields.map(f => (
                                            <td key={f.id} className="px-6 py-3 text-slate-600">
                                                {r.raw_data.custom_data?.[f.id] || '-'}
                                            </td>
                                        ))}
                                        <td className="px-6 py-3 text-red-600 font-medium">{r.validation_message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button onClick={() => setStep(1)} className="px-6 py-2 text-slate-500 hover:text-slate-800 font-medium">Cancelar</button>
                        <button
                            disabled={loading || summary.valid === 0}
                            onClick={handleCommit}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : `Confirmar Importación (${summary.valid} registros)`}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <div className="bg-white p-12 rounded-xl shadow text-center max-w-lg mx-auto border border-green-200">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🎉</div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Importación Completada!</h2>
                    <p className="text-slate-600 mb-8">Tus datos han sido importados exitosamente a la base de datos maestra.</p>
                    <button onClick={() => setStep(1)} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">Importar Otro Archivo</button>
                </div>
            )}

        </div>
    )
}
