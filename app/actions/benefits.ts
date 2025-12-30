'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getBenefits() {
    const supabase = createAdminClient()
    const { data: benefits, error } = await supabase
        .from('benefits_catalog')
        .select('*')
        .order('provider_name', { ascending: true })

    if (error) {
        console.error('Error fetching benefits:', error)
        return []
    }
    return benefits
}

export async function saveBenefit(data: any) {
    const supabase = createAdminClient()
    const { id, ...payload } = data

    if (id) {
        // Update
        const { error } = await (supabase
            .from('benefits_catalog') as any)
            .update(payload)
            .eq('id', id)

        if (error) return { error: error.message }
    } else {
        // Insert
        const { error } = await (supabase
            .from('benefits_catalog') as any)
            .insert(payload)

        if (error) return { error: error.message }
    }

    revalidatePath('/dashboard/beneficios')
    return { success: true }
}

export async function toggleBenefitStatus(id: string, currentStatus: boolean) {
    const supabase = createAdminClient()
    const { error } = await (supabase
        .from('benefits_catalog') as any)
        .update({ is_active: !currentStatus })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/beneficios')
    return { success: true }
}

export async function deleteBenefit(id: string) {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('benefits_catalog')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/beneficios')
    return { success: true }
}
