'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { parse } from 'csv-parse/sync'

// Helper: "The Brain" - Normalization
function cleanRut(rut: any): string {
    if (!rut) return ''
    // Remove everything that is not a number or K
    return String(rut).replace(/[^0-9kK]/g, '').toUpperCase()
}

// Type for Granular Errors
type ImportErrorDetail = {
    row: number
    input: string
    reason: string
}

export type ImportResult = {
    success: boolean
    message?: string
    stats?: {
        processed: number
        created: number
        errors: number
        errorList: ImportErrorDetail[] // Changed to structured object
    }
}

// Type for CSV Row
type CsvRow = {
    rut_titular?: string
    nombre_completo?: string
    nombre_carga?: string
    parentesco?: string
    rut_carga?: string
    fecha_nacimiento?: string
}

import { createAdminClient } from "@/utils/supabase/admin" // Elevated Privileges

export async function processFamilyImport(formData: FormData): Promise<ImportResult> {
    const file = formData.get('file') as File
    if (!file) {
        return { success: false, message: 'No se subió ningún archivo.' }
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const content = buffer.toString('utf-8')

        // Parse CSV
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true // Tolerant parsing
        }) as CsvRow[]

        if (!records || records.length === 0) {
            return { success: false, message: 'El archivo CSV está vacío o ilegible.' }
        }

        // Validate Headers Check
        const firstRow = records[0]
        if (!firstRow.rut_titular) {
            return { success: false, message: 'Falta la columna obligatoria "rut_titular". Por favor usa la plantilla actualizada.' }
        }

        // 2. The Muscle: Elevated Search (Admin Client)
        const supabaseAdmin = createAdminClient()
        if (!supabaseAdmin) {
            return { success: false, message: 'Error de configuración: Servicio de administración no disponible.' }
        }

        // Fetch ALL potential parents to build an In-Memory Lookup Map
        // We select minimal fields to keep it fast.
        // We assume the importer is an Admin who has access to the Tenant's users.
        // But to be safe and find "orphaned" users we search globally or by the importer's tenant?
        // Let's assume the importer operates within their tenant context.
        // We get the current user's tenant first.

        const supabaseUser = await createClient() // Normal client to get current user context
        const { data: { user } } = await supabaseUser.auth.getUser()
        if (!user) return { success: false, message: 'No autorizado' }

        const { data: adminProfile } = await supabaseAdmin.from('user_profiles').select('tenant_id').eq('id', user.id).single()

        if (!adminProfile || typeof adminProfile !== 'object' || !('tenant_id' in (adminProfile as any))) {
            return { success: false, message: 'Perfil o Sindicato no encontrado' }
        }
        const currentTenantId = (adminProfile as any).tenant_id as string

        // Fetch all profiles in tenant (or maybe all if superadmin? Stick to tenant isolation for safety)
        const { data: allProfiles, error: profilesError } = await (supabaseAdmin
            .from('user_profiles') as any)
            .select('id, custom_data, full_name, email, rut')
            .eq('tenant_id', currentTenantId)

        if (profilesError || !allProfiles) {
            console.error('Error fetching profiles:', profilesError)
            return { success: false, message: 'Error crítico al cargar socios: ' + (profilesError?.message || 'Datos nulos') }
        }

        // Build the "Brain Map"
        // key: cleaned_rut -> value: User Object
        const itemMap = new Map<string, any>()

        allProfiles.forEach((p: any) => {
            // Map by Clean RUT from official column
            const rutRaw = p.rut || p.custom_data?.rut
            if (rutRaw) {
                const clean = cleanRut(rutRaw)
                if (clean) itemMap.set(clean, p)
            }
            // Optional: Map by Email too?
            // if (p.email) itemMap.set(p.email.toLowerCase().trim(), p)
        })

        const validInserts: any[] = []
        const errorDetails: ImportErrorDetail[] = []

        let rowIndex = 0
        for (const row of records) {
            rowIndex++

            // 1. Normalize Inputs
            const rawRutTitular = row.rut_titular || ''
            const cleanRawRut = cleanRut(rawRutTitular)

            if (!cleanRawRut) {
                errorDetails.push({ row: rowIndex, input: rawRutTitular, reason: 'RUT Titular vacío o inválido' })
                continue
            }

            // 2. Fuzzy Match
            const parent = itemMap.get(cleanRawRut)

            if (!parent) {
                errorDetails.push({ row: rowIndex, input: rawRutTitular, reason: `Titular no encontrado (RUT Limpio: ${cleanRawRut})` })
                continue
            }

            // 3. Validation of Payload
            if (!row.nombre_carga && !row.nombre_completo) { // Support both header names
                errorDetails.push({ row: rowIndex, input: cleanRawRut, reason: 'Falta nombre de la carga' })
                continue
            }

            // Transform Relationship
            let relationship = row.parentesco || 'Other'
            const lowerRel = relationship.toLowerCase()
            if (lowerRel.includes('hijo') || lowerRel.includes('hija')) relationship = 'Child'
            else if (lowerRel.includes('conyuge') || lowerRel.includes('cónyuge') || lowerRel.includes('espos')) relationship = 'Spouse'
            else if (lowerRel.includes('padre') || lowerRel.includes('madre')) relationship = 'Parent'

            // Normalize Date (DD-MM-YYYY or DD/MM/YYYY -> YYYY-MM-DD)
            let birthDate = row.fecha_nacimiento || null
            if (birthDate) {
                // Try to parse DD-MM-YYYY or DD/MM/YYYY
                const parts = birthDate.split(/[-/]/)
                if (parts.length === 3) {
                    // Assumption: Day is first (Latin format)
                    // If year is last (4 digits)
                    if (parts[2].length === 4) {
                        const day = parts[0].padStart(2, '0')
                        const month = parts[1].padStart(2, '0')
                        const year = parts[2]
                        birthDate = `${year}-${month}-${day}`
                    }
                }
            }

            // Prepare Insert
            validInserts.push({
                user_id: parent.id,
                tenant_id: currentTenantId,
                full_name: row.nombre_carga || row.nombre_completo, // Support legacy header
                relationship: relationship,
                rut: row.rut_carga || null,
                birth_date: birthDate
            })
        }

        // 4. Batch Commit
        if (validInserts.length > 0) {
            const { error: insertError } = await (supabaseAdmin
                .from('family_members') as any)
                .insert(validInserts)

            if (insertError) {
                console.error('Error inserting family members:', insertError)
                // We'll consider this a "partial" failure if some rows were valid but DB rejected them
                return { success: false, message: 'Error DB al guardar cargas: ' + insertError.message }
            }
        }

        revalidatePath('/dashboard/socios')

        return {
            success: true,
            stats: {
                processed: records.length,
                created: validInserts.length,
                errors: errorDetails.length,
                errorList: errorDetails
            }
        }

    } catch (e: any) {
        console.error('Import Generic Error:', e)
        return { success: false, message: 'Error crítico en el procesador: ' + e.message }
    }
}

export async function resetFamilyData() {
    const supabase = await createClient()
    const { error } = await supabase.from('family_members').delete().neq('id', '00000000-0000-0000-0000-000000000000') // safer delete all
    if (error) {
        console.error('Reset Error:', error)
        return { success: false, error: error.message }
    }
    revalidatePath('/dashboard/cargas/importar')
    revalidatePath('/dashboard/socios')
    return { success: true }
}
