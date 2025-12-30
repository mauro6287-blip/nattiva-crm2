'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// 1. Create Content (Provider)
export async function createContent(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // Authenticate
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // Get Tenant
    const { data: profile } = await (supabase
        .from('user_profiles') as any)
        .select('tenant_id, full_name')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Perfil no encontrado' }

    const title = formData.get('title') as string
    const summary = formData.get('summary') as string
    const content_html = formData.get('content_html') as string
    const category = formData.get('category') as string
    const thumbnail_url = formData.get('thumbnail_url') as string
    const action = formData.get('action') as string // 'save_draft' or 'submit'

    const status = action === 'submit' ? 'enviado' : 'borrador'

    const { error } = await (supabase
        .from('content_items') as any)
        .insert({
            tenant_id: profile.tenant_id,
            provider_id: user.id,
            author_name: profile.full_name,
            title,
            summary,
            content_html,
            category,
            thumbnail_url: thumbnail_url || undefined, // Use DB default if empty
            status
        })

    if (error) {
        return { error: 'Error al crear contenido: ' + error.message }
    }

    revalidatePath('/dashboard/contenidos')
    redirect('/dashboard/contenidos')
}

// 2. Approve/Reject Content (Admin)
export async function reviewContent(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // Verify Admin Role (simplified check, real app should check permissions table)
    // For MVP, if you can call this, you are effectively an admin in the UI logic context,
    // but RLS should enforce it. We'll trust RLS 'Allow all' for now or add check if strict.
    // The 'content_reviews' table insert will trigger logic or just be audit log.
    // We need to update the item status AND insert a review record.

    const content_id = formData.get('content_id') as string
    const decision = formData.get('decision') as string // 'approve', 'reject'
    const comment = formData.get('comment') as string

    const new_status = decision === 'approve' ? 'publicado' : 'rechazado' // 'publicado' per requirement for API visibility

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // 1. Update verification/status
    const { error: updateError } = await (supabase
        .from('content_items') as any)
        .update({ status: new_status })
        .eq('id', content_id)

    if (updateError) return { error: 'Error al actualizar estado: ' + updateError.message }

    // 2. Log Review
    const { error: reviewError } = await (supabase
        .from('content_reviews') as any)
        .insert({
            content_item_id: content_id,
            reviewer_id: user.id,
            new_status: new_status,
            comment: comment
        })

    if (reviewError) console.error('Error logging review:', reviewError) // Non-blocking

    revalidatePath('/dashboard/contenidos')
    return { success: true, error: undefined }
}
