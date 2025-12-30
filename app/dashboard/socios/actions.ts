'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createSocio(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // 1. Get current user & tenant context
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'No autenticado' }
    }

    // Get user profile to find tenant_id
    const { data: profile, error: profileError } = await (supabase
        .from('user_profiles') as any)
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        console.error('Profile Fetch Error:', profileError)
        return { error: `Error identificando al usuario: ${profileError?.message || 'Perfil no encontrado'}` }
    }

    const tenant_id = profile.tenant_id

    // 2. Extract Data
    const names = formData.get('names') as string
    const surnames = formData.get('surnames') as string
    const rut_or_document = formData.get('rut_or_document') as string
    const email = formData.get('email') as string
    const join_date = formData.get('join_date') as string

    // Extract Custom Fields
    const custom_data: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('custom_')) {
            const fieldId = key.replace('custom_', '')
            custom_data[fieldId] = value
        }
    }

    // Simple validation
    if (!names || !surnames || !rut_or_document || !email) {
        return { error: 'Faltan campos obligatorios: Nombres, Apellidos, RUT y Email son requeridos.' }
    }

    // Check for duplicate email
    const { data: existingUser } = await (supabase
        .from('user_profiles') as any)
        .select('id')
        .eq('email', email)
        .single()

    if (existingUser) {
        return { error: 'Este email ya está registrado por otro socio.' }
    }

    // 3. Insert into Database (Target: user_profiles)
    // We map 'socios' fields to 'user_profiles' structure (custom_data/metadata)

    // Construct valid metadata
    const metadata = {
        source: 'manual',
        status: 'pending',
        created_by: user.id
    }

    // Ensure standard fields are in custom_data for retrieval
    if (join_date) custom_data['join_date'] = join_date
    if (names) custom_data['names'] = names
    if (surnames) custom_data['surnames'] = surnames
    if (rut_or_document) custom_data['rut'] = rut_or_document

    const { error: insertError } = await (supabase
        .from('user_profiles') as any)
        .insert({
            tenant_id,
            id: crypto.randomUUID(), // Explicitly generate ID or let DB do it? Auth users usually have IDs from Auth. But these are "Shadow Users" or "Managed Users" not yet invited? 
            // The dashboard shows them, so they are profiles. 
            // If we want them to eventually login, we usually create them in Auth first or invite them.
            // For now, assuming "Managed User" pattern: create profile, no auth user yet.
            full_name: `${names} ${surnames}`.trim(),
            email: email || null,
            // join_date: join_date || null, // Not a column in user_profiles
            // status: 'pending', // Not a column? Dashboard uses status badge from ? 
            // The dashboard uses `is_active` or checks metadata/custom_data?
            // Page.tsx: <StatusBadge status={socio.is_active ? 'verified' : 'pending'} />
            // So we relying on is_active defaults (probably true/false).
            // Let's set custom_data and metadata.
            custom_data: custom_data,
            metadata: metadata,
            updated_at: new Date().toISOString()
        })

    if (insertError) {
        console.error('Error creating socio:', insertError)
        return { error: 'Error al crear el perfil de socio: ' + insertError.message }
    }

    // 4. Revalidate & Redirect
    revalidatePath('/dashboard/socios')
    redirect('/dashboard/socios')
}

export async function updateSocio(id: string, prevState: any, formData: FormData) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Unauthorized' }

    // 2. Extract Custom Data
    const custom_data: Record<string, any> = {}

    // We need to preserve existing custom_data that isn't in the form? 
    // Usually formData has everything we want to save. 
    // But for orphaned data, if we don't render it as input, we might lose it?
    // The prompt says: "display them in a ... section ... so data is preserved visible."
    // And "Update... merging new inputs with existing data."
    // So I should fetch existing first? Or assume frontend handles it?
    // Safer to merge in backend or frontend.
    // Let's rely on frontend sending ALL keys (including orphaned ones as hidden inputs or just ignoring them if we fetch-merge).
    // Prompt says: "Update the user_profiles.custom_data... merging..."
    // I'll fetch current first to merge safely.

    // Fetch current to merge
    const { data: current, error: fetchError } = await (supabase
        .from('user_profiles') as any)
        .select('custom_data')
        .eq('id', id)
        .single()

    if (fetchError) {
        // Try socios? Prompt implies user_profiles.
        return { error: 'Member not found' }
    }

    const mergedData = { ...(current.custom_data || {}) }

    // Update with form data
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('custom_')) {
            const fieldKey = key.replace('custom_', '')

            // Critical Sanity Check: Prevent 'undefined' or empty keys
            if (!fieldKey || fieldKey === 'undefined' || fieldKey === 'null') {
                continue
            }

            // Value is string, but if empty?
            if (value === '' || value === null) {
                // If value is empty, we might want to keep it as empty string or delete it?
                // For now, save as empty string to match form state.
                mergedData[fieldKey] = ''
            } else {
                mergedData[fieldKey] = value
            }
        }
    }

    // Explicit cleanup of garbage keys if they exist
    delete mergedData['undefined']
    delete mergedData['null']

    // 3. Update
    const { error } = await (supabase
        .from('user_profiles') as any)
        .update({
            custom_data: mergedData,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/socios/${id}`)
    revalidatePath('/dashboard/socios')
    return { success: true }
}

export async function deleteSocio(id: string) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Unauthorized' }

    // 2. Delete Operation
    // Deleting from user_profiles as that is what the list views.
    const { error } = await (supabase
        .from('user_profiles') as any)
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Delete Error:', error)
        return { error: 'Error deleting member: ' + error.message }
    }

    revalidatePath('/dashboard/socios')
    return { success: true }
}
