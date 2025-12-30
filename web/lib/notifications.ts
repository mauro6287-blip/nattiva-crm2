
export interface EmailPayload {
    to: string
    subject: string
    html: string
}

export interface PushPayload {
    userId: string
    title: string
    body: string
}


interface NotificationPayload {
    targetEmail?: string
    ticketTitle: string
    messageContent: string
    agentName: string
    userId?: string
}

export async function sendTicketNotification({ targetEmail, ticketTitle, messageContent, agentName, userId }: NotificationPayload) {
    // 1. Send Email (Mock)
    if (targetEmail) {
        console.log(`[NOTIFICACIÓN] Enviando Email a: ${targetEmail} | Asunto: Respuesta a ticket ${ticketTitle}`)
        // console.log(`[CONTENT] ${messageContent}`)
    }

    // 2. Send Push (Mock)
    if (userId) {
        console.log(`[NOTIFICACIÓN] Enviando Push a UserID: ${userId} | Mensaje: Tienes una nueva respuesta.`)
    }

    return { success: true }
}

