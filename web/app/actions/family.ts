'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function getFamilyMembers(userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Ensure tenant access logic if needed, but RLS handles it mostly.
    // For extra safety, we could check if viewer shares tenant with target user.

    const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching family members:', error)
        return []
    }
    return data
}

export async function addFamilyMember(userId: string, formData: FormData) {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Unauthorized' }

    // Step 1: Fetch Parent Context (Crucial)
    // We use userId to get the target profile's tenant, assuming the caller has permission (RLS or admin client)
    const { data: profile, error: profileError } = await (supabase.from('user_profiles') as any).select('tenant_id').eq('id', userId).single()

    if (profileError || !profile || !('tenant_id' in (profile as any))) {
        console.error('Error fetching parent profile:', profileError)
        return { error: 'No se pudo validar el contexto de la organización (Tenant ID missing).' }
    }
    const tenantId = (profile as any).tenant_id as string

    const tenant_id = profile.tenant_id

    // Check Payload
    // Check Payload
    const full_name = formData.get('full_name') as string
    const relationship = formData.get('relationship') as string
    const rut = formData.get('rut') as string
    const birth_date = formData.get('birth_date') as string

    // Log raw data for debugging
    console.log('Received Family Member Data:', { full_name, relationship, rut, birth_date, userId })

    if (!full_name || full_name.trim() === '') {
        return { error: 'El nombre completo es obligatorio.' }
    }
    if (!relationship) {
        return { error: 'El parentesco es obligatorio.' }
    }

    // Step 2: Insert with ID
    // 2. Insert member
    const { error } = await (supabase
        .from('family_members') as any)
        .insert({
            tenant_id: tenantId,
            user_id: userId, // Target Parent ID
            full_name: full_name,
            relationship: relationship,
            rut: rut || null,
            birth_date: birth_date || null
        })

    if (error) { // Changed from insertError to error
        console.error('Error inserting family member:', error)
        return { error: 'Error al guardar carga familiar: ' + error.message }
    }

    // Step 3: Refresh
    revalidatePath(`/dashboard/socios/${userId}`)
    return { success: true }
}

export async function deleteFamilyMember(id: string, userId: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('family_members').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath(`/dashboard/socios/${userId}`)
    return { success: true }
}
