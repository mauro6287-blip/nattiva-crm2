'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Logger } from '@/utils/logger' // Assuming this can be client-side shimmed or mocked, but Logger imports admin. 
// We will just use console on client or a client-compatible logger.
const logStart = (action: string) => console.log(`[Inbox] ${action}`)

interface Task {
    id: string
    type: 'ticket' | 'validation' | 'content'
    priority: 'High' | 'Normal'
    title: string
    user: string
    waiting_since: string
    status: string
    metadata: any
}

export default function WorkInboxPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null) // For Detail Modal
    const [smartMatchTask, setSmartMatchTask] = useState<Task | null>(null) // For Smart Match Modal

    const fetchTasks = async () => {
        setLoading(true)
        const res = await fetch('/api/backoffice/inbox')
        const data = await res.json()
        setTasks(data.tasks || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchTasks()
    }, [])

    const handleAction = async (task: Task, action: 'approve' | 'reject') => {
        if (task.status === 'ambiguous' && action === 'approve') {
            // Trigger Smart Match instead of direct approve
            setSmartMatchTask(task)
            return
        }

        // Optimistic UI Update
        setTasks(prev => prev.filter(t => t.id !== task.id))

        // Call API/Server Action to actually perform update (Stubbed for now)
        // In real app, we'd hit /api/backoffice/resolve or similar
        console.log(`Processing ${action} on ${task.id}`)
    }

    // --- SMART MATCH MODAL COMPONENTS ---
    const SmartMatchModal = ({ task, onClose }: { task: Task, onClose: () => void }) => {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                        <h2 className="text-xl font-bold">Smart Match: Ambiguous Identity</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                    </div>

                    <div className="p-6 grid grid-cols-2 gap-8 bg-slate-50 flex-1 overflow-auto">
                        {/* LEFT: App Data */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-500 uppercase text-sm">Incoming from App</h3>
                            <div className="bg-white p-4 rounded shadow border border-slate-200">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                                        {task.user.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg">{task.user}</div>
                                        <div className="text-sm text-slate-500">{task.metadata.original.payload?.email || 'No Email'}</div>
                                    </div>
                                </div>
                                <div className="text-xs font-mono bg-slate-100 p-2 rounded">
                                    Raw ID: {task.metadata.original.payload?.gb_id || 'N/A'}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Suggested Matches */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-500 uppercase text-sm">Suggested Matches (Padron)</h3>
                            <div className="bg-green-50 border border-green-200 p-4 rounded cursor-pointer hover:bg-green-100 transition ring-2 ring-green-500">
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-green-900">{task.user} (Exact Match)</div>
                                    <span className="bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold">98% Match</span>
                                </div>
                                <div className="text-sm text-green-800 mt-1">RUT: 12.345.678-9</div>
                                <button
                                    onClick={() => {
                                        alert('Linked successfully!')
                                        handleAction(task, 'approve') // Complete the flow
                                        onClose()
                                    }}
                                    className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-sm font-bold"
                                >
                                    Link Account
                                </button>
                            </div>

                            <div className="bg-white border border-slate-200 p-4 rounded opacity-60">
                                <div className="font-medium">Juan A. Perez</div>
                                <div className="text-sm text-slate-500">RUT: 11.111.111-1</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Work Inbox</h1>
                <button onClick={fetchTasks} className="text-sm text-blue-600 hover:underline">Refresh</button>
            </header>

            {loading ? (
                <div className="p-10 text-center text-slate-400">Loading inbox...</div>
            ) : tasks.length === 0 ? (
                <div className="p-20 text-center bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-slate-800">Inbox Zero!</h2>
                    <p className="text-slate-500">Good job, you're all caught up.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Priority</th>
                                <th className="px-6 py-3 font-semibold">Type</th>
                                <th className="px-6 py-3 font-semibold">Subject / User</th>
                                <th className="px-6 py-3 font-semibold">Waiting</th>
                                <th className="px-6 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tasks.map(task => (
                                <tr key={task.id} className="group hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4">
                                        {task.priority === 'High' ? (
                                            <span className="inline-flex items-center text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded-full">
                                                🔥 High
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs font-medium">Normal</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold uppercase ${task.type === 'validation' ? 'text-purple-600' :
                                                task.type === 'content' ? 'text-blue-600' : 'text-slate-600'
                                            }`}>
                                            {task.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{task.title}</div>
                                        <div className="text-sm text-slate-500">{task.user}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {/* Simple relative time shim */}
                                        {Math.floor((Date.now() - new Date(task.waiting_since).getTime()) / (1000 * 60))}m ago
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleAction(task, 'approve')}
                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-bold shadow-sm"
                                        >
                                            {task.type === 'content' ? 'Approve' : task.status === 'ambiguous' ? 'Resolve' : 'Close'}
                                        </button>
                                        <button
                                            onClick={() => handleAction(task, 'reject')}
                                            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1 rounded text-xs font-bold shadow-sm"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODALS */}
            {smartMatchTask && <SmartMatchModal task={smartMatchTask} onClose={() => setSmartMatchTask(null)} />}
        </div>
    )
}
