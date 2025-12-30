'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle, Download, FileSpreadsheet, Upload, AlertTriangle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { processFamilyImport, resetFamilyData, type ImportResult } from '@/app/actions/import-family'
import { cleanupErroneousSocios } from '@/app/actions/cleanup'
import { useRouter } from 'next/navigation'

export default function ImportFamilyPage() {
    const [file, setFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const router = useRouter()

    const handleReset = async () => {
        if (!confirm('¿Estás seguro de eliminar TODAS las cargas familiares? Esta acción no se puede deshacer.')) return
        setIsProcessing(true)
        await resetFamilyData()
        alert('Datos eliminados correctamente')
        setResult(null)
        setIsProcessing(false)
        router.refresh()
    }

    const handleCleanupSocios = async () => {
        if (!confirm('¿CONFIRMAR? Esto borrará todos los "Socios" que tengan origen "Csv_import". Úsalo solo si importaste cargas como socios por error.')) return
        setIsProcessing(true)
        const res = await cleanupErroneousSocios()
        if (res.success) {
            alert(res.message)
        } else {
            alert('Error: ' + res.error)
        }
        setIsProcessing(false)
        router.refresh()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null) // Reset previous results
        }
    }

    const handleImport = async () => {
        if (!file) return
        setIsProcessing(true)
        const formData = new FormData()
        formData.append('file', file)

        const response = await processFamilyImport(formData)
        setResult(response)
        setIsProcessing(false)
    }

    // Generate a simple CSV template for download
    const downloadTemplate = () => {
        // Updated headers to match the more tolerant importer
        const headers = ['rut_titular,nombre_carga,parentesco,rut_carga,fecha_nacimiento']
        const row1 = ['12345678-9,Juanito Perez Jr,Hijo,25000000-1,2015-05-20']
        const row2 = ['98765432-1,Maria Gonzalez,Conyuge,15000000-K,1990-01-15']

        const blob = new Blob([[...headers, ...row1, ...row2].join('\n')], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'plantilla_cargas_familiares_v2.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Importación Masiva de Cargas</h1>
                        <p className="text-gray-500">
                            Sube un archivo CSV para asignar cargas familiares a los socios existentes.
                        </p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleReset} disabled={isProcessing}>
                        <Trash2 className="w-4 h-4 mr-2" /> Borrar Cargas (Reset)
                    </Button>
                </div>
                {/* Erroneous Cleanup Tool */}
                <div className="bg-amber-50 p-3 rounded-md border border-amber-200 flex items-center justify-between text-sm text-amber-900 mt-2">
                    <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ¿Importaste cargas como socios por error?
                    </span>
                    <Button variant="outline" size="sm" className="border-amber-300 hover:bg-amber-100 text-amber-800" onClick={handleCleanupSocios} disabled={isProcessing}>
                        Limpiar Socios Erróneos
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-600" />
                        Subir Archivo
                    </CardTitle>
                    <CardDescription>
                        El sistema normalizará automáticamente los RUTs (puntos, guiones). <br />
                        Columna clave: <strong>rut_titular</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end border p-4 rounded-lg bg-gray-50">
                        <div className="w-full">
                            <label className="text-sm font-medium mb-2 block text-gray-700">Seleccionar CSV</label>
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="bg-white"
                            />
                        </div>
                        <Button
                            onClick={handleImport}
                            disabled={!file || isProcessing}
                            className="w-full md:w-auto min-w-[140px]"
                        >
                            {isProcessing ? 'Procesando...' : (
                                <><FileSpreadsheet className="mr-2 h-4 w-4" /> Procesar</>
                            )}
                        </Button>
                    </div>

                    <div className="flex justify-start">
                        <Button variant="link" onClick={downloadTemplate} className="text-blue-600 p-0 h-auto">
                            <Download className="mr-2 h-4 w-4" /> Descargar Plantilla Actualizada
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results Section */}
            {result && (
                <div className={`rounded-lg p-6 border ${result.success ? 'bg-white border-gray-200 shadow-sm' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start gap-4">
                        {result.success ? (
                            <div className="p-2 bg-green-100 rounded-full text-green-600">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                        ) : (
                            <div className="p-2 bg-red-100 rounded-full text-red-600">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                        )}

                        <div className="space-y-2 flex-1">
                            <h3 className={`font-bold text-lg ${result.success ? 'text-gray-900' : 'text-red-800'}`}>
                                {result.success ? 'Importación Completada' : 'Error en Importación'}
                            </h3>

                            {result.message && <p className="text-gray-700">{result.message}</p>}

                            {result.stats && (
                                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">{result.stats.processed}</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide">Filas Leídas</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{result.stats.created}</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide">Creadas</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-amber-600">{result.stats.errors}</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide">Errores / Omitidos</div>
                                    </div>
                                </div>
                            )}

                            {/* Error Details Table */}
                            {result.stats && result.stats.errorList.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-amber-800">
                                        <AlertTriangle className="w-4 h-4" />
                                        Detalle de Errores ({result.stats.errorList.length})
                                    </h4>
                                    <div className="border rounded-md overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 w-16 text-center">Fila</th>
                                                    <th className="px-4 py-2">Dato Ingresado</th>
                                                    <th className="px-4 py-2">Razón del Error</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {result.stats.errorList.map((err: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 font-mono text-center text-gray-500">{err.row}</td>
                                                        <td className="px-4 py-2 font-mono text-gray-800">{err.input}</td>
                                                        <td className="px-4 py-2 text-red-600">{err.reason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
