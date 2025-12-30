'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { addMessage } from '@/app/actions/tickets'
import { Send, FileText, Paperclip, X, Image as ImageIcon } from 'lucide-react'
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TicketChat({
    ticketId,
    initialMessages,
    macros,
    currentUserId
}: {
    ticketId: string,
    initialMessages: any[],
    macros: any[],
    currentUserId: string
}) {
    const [messages, setMessages] = useState(initialMessages)
    const [content, setContent] = useState('')
    const [sending, setSending] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [attachments, setAttachments] = useState<any[]>([])
    const bottomRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const supabase = createClient()

    // Sync state if initialMessages changes (revalidation)
    useEffect(() => {
        setMessages(initialMessages)
    }, [initialMessages])

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        setUploading(true)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${ticketId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('ticket-attachments')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('ticket-attachments')
                .getPublicUrl(filePath)

            setAttachments(prev => [...prev, {
                name: file.name,
                type: file.type,
                url: publicUrl
            }])
        } catch (error: any) {
            console.error('Upload error:', error)
            alert('Error subiendo archivo: ' + error.message)
        } finally {
            setUploading(false)
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    function removeAttachment(index: number) {
        setAttachments(prev => prev.filter((_, i) => i !== index))
    }

    async function handleSend() {
        if (!content.trim() && attachments.length === 0) return
        setSending(true)

        // Pass attachments to server action
        const res = await addMessage(ticketId, content, attachments)

        setSending(false)
        if (res.error) {
            alert(res.error)
        } else {
            if (res.notificationSent) {
                // Ideally use a Toast component, for now simple alert or local state feedback
                // toast.success("Notificación enviada al usuario")
                console.log("Notificación enviada al usuario")
            }
            setContent('')
            setAttachments([])
        }
    }

    function insertMacro(macroContent: string) {
        const text = macroContent.replace('{{name}}', 'Cliente')
        setContent((prev) => prev ? prev + '\n' + text : text)
    }

    return (
        <div className="flex flex-col h-[600px] border rounded-lg bg-white overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground mt-10">Sin mensajes.</div>
                )}

                {messages.map((m) => {
                    const isMe = m.user_id === currentUserId
                    return (
                        <div key={m.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[80%] rounded-lg p-3 text-sm shadow-sm",
                                isMe ? "bg-blue-600 text-white" : "bg-white border text-gray-800"
                            )}>
                                {/* Text Content */}
                                {m.content && <div className="whitespace-pre-wrap">{m.content}</div>}

                                {/* Attachments Rendering */}
                                {m.attachments && m.attachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {m.attachments.map((att: any, idx: number) => (
                                            <div key={idx} className="rounded overflow-hidden border bg-background/50">
                                                {att.type?.startsWith('image/') ? (
                                                    <a href={att.url} target="_blank" rel="noopener noreferrer">
                                                        <img src={att.url} alt={att.name} className="max-w-full max-h-[200px] object-cover" />
                                                    </a>
                                                ) : (
                                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 hover:bg-black/5 transition-colors">
                                                        <FileText className="w-4 h-4" />
                                                        <span className="truncate underline">{att.name || 'Adjunto'}</span>
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className={cn("text-xs mt-1 opacity-70 flex justify-end gap-1", isMe ? "text-blue-100" : "text-gray-400")}>
                                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white">
                {/* Upload Preview */}
                {attachments.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                        {attachments.map((att, idx) => (
                            <div key={idx} className="relative group border rounded p-1 bg-slate-50">
                                {att.type?.startsWith('image/') ? (
                                    <img src={att.url} alt="preview" className="h-16 w-16 object-cover rounded" />
                                ) : (
                                    <div className="h-16 w-16 flex items-center justify-center bg-gray-100 text-xs text-center p-1 break-all">
                                        {att.name}
                                    </div>
                                )}
                                <button
                                    onClick={() => removeAttachment(idx)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-2 mb-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1">
                                <FileText className="h-3 w-3" /> Macros
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>Respuestas Rápidas</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {macros.length === 0 ? (
                                <div className="p-2 text-xs text-muted-foreground">No hay macros disponibles.</div>
                            ) : (
                                macros.map(macro => (
                                    <DropdownMenuItem key={macro.id} onClick={() => insertMacro(macro.content)}>
                                        {macro.title}
                                    </DropdownMenuItem>
                                ))
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,application/pdf"
                    />
                </div>

                <div className="flex gap-2">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="min-h-[80px] resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={sending || (!content.trim() && attachments.length === 0) || uploading}
                        className="h-[80px] w-[80px]"
                    >
                        {uploading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
