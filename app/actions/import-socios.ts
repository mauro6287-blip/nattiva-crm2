'use server'

import { createAdminClient } from '@/utils/supabase/admin' // Use admin client for heavy lifting/validation
import { createClient } from '@/utils/supabase/server' // User context for tenant resolution

export async function uploadCSV(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    const text = await file.text()
    const rows = text.split('\n')

    // Parse Headers (Row 0)
    // We assume the file has at least 1 row
    if (rows.length < 1) return { error: 'Empty file' }

    // Delimiter Sniffer
    const firstLine = rows[0]
    const commaCount = (firstLine.match(/,/g) || []).length
    const semicolonCount = (firstLine.match(/;/g) || []).length
    const delimiter = semicolonCount > commaCount ? ';' : ','

    const headerRow = firstLine.toLowerCase().split(delimiter).map(c => c.trim())

    // Flexible Mapping Logic
    // Returns index or -1
    const getIndex = (keywords: string[]) => headerRow.findIndex(h => keywords.some(k => h.includes(k)))

    const idxNames = getIndex(['nombre', 'name', 'nombres'])
    const idxSurnames = getIndex(['apellido', 'surname', 'apellidos'])
    const idxRut = getIndex(['rut', 'identificador', 'document', 'id'])
    const idxEmail = getIndex(['email', 'correo', 'mail'])

    // Default to -1 if header detection fails, except for Name which we might fallback to 0 if desperate, 
    // but better to be strict or use the found indices.
    // The user issue "concatenation" is likely Name + Surnames (where Surnames = RUT due to fallback index 1)
    const map = {
        names: idxNames, // If -1, we won't grab random data
        surnames: idxSurnames,
        rut: idxRut,
        email: idxEmail
    }

    // Resolve Tenant/User
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Helper to get tenant AND fetch custom fields
    const supabaseAdmin = createAdminClient()
    if (!supabaseAdmin) return { error: 'Error de configuración: Cliente Admin no disponible' }

    const { data: profile } = await (supabaseAdmin.from('user_profiles') as any).select('tenant_id').eq('id', user.id).single()

    if (!profile || typeof profile !== 'object' || !('tenant_id' in (profile as any))) {
        return { error: 'Perfil o Sindicato no encontrado' }
    }
    const tenantId = (profile as any).tenant_id as string

    // Fetch Custom Fields Definitions
    const { data: customFieldsDefs } = await (supabaseAdmin
        .from('organization_fields') as any)
        .select('id, field_key, label, data_type')
        .eq('tenant_id', tenantId) // Tenant isolation check
        .eq('is_active', true)

    // Map Custom Fields
    // We map: Label in CSV -> field_key in custom_data
    const customFieldMap: Record<string, number> = {}
    if (customFieldsDefs) {
        customFieldsDefs.forEach((field: any) => {
            // Check if label exists in headers (case insensitive)
            const idx = headerRow.findIndex(h => h === field.label.toLowerCase().trim())
            if (idx !== -1) {
                // Store field_key as the target key for custom_data
                // Use field_key if available, else fallback to something else (but migration ensures field_key)
                customFieldMap[field.field_key] = idx
            }
        })
    }

    const batchId = crypto.randomUUID()
    const entries = []

    // Process Data Rows (Start from index 1)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row.trim()) continue

        // Handle values 
        const cols = row.split(delimiter).map(c => c.trim())

        // Extract Custom Data
        const customDataExtraction: Record<string, any> = {}
        Object.entries(customFieldMap).forEach(([fieldId, colIndex]) => {
            if (cols[colIndex]) {
                customDataExtraction[fieldId] = cols[colIndex]
            }
        })

        entries.push({
            batch_id: batchId,
            tenant_id: tenantId,
            raw_data: {
                names: (map.names !== -1 ? cols[map.names] : '') || '',
                surnames: (map.surnames !== -1 ? cols[map.surnames] : '') || '',
                rut: (map.rut !== -1 ? cols[map.rut] : '') || '',
                email: (map.email !== -1 ? cols[map.email] : '') || null,
                custom_data: customDataExtraction
            },
            status: 'PENDING'
        })
    }

    if (entries.length === 0) return { error: 'No valid rows found' }

    // Insert
    const { error } = await (supabaseAdmin.from('import_staging_socios') as any).insert(entries)

    if (error) return { error: error.message }

    return { success: true, batchId }
}

export async function validateBatch(batchId: string) {
    const supabase = createAdminClient()
    if (!supabase) return { success: false, error: 'Cliente Admin no disponible' }

    // Get Pending rows
    const { data: rows } = await (supabase
        .from('import_staging_socios') as any)
        .select('*')
        .eq('batch_id', batchId)
        .eq('status', 'PENDING')

    if (!rows || rows.length === 0) return { success: true }

    // This loop is slow for 1000s of rows, but ok for MVP < 500.
    // Ideally we use a Postgres function for bulk validation.
    for (const row of rows) {
        const { names, surnames, rut, email } = row.raw_data
        let status = 'VALID'
        let msg = null

        // 1. Basic format
        if (!names || !rut) {
            status = 'ERROR'
            msg = 'Faltan campos requeridos (Nombre o RUT)'
        }
        else if (email && !email.includes('@')) {
            status = 'ERROR'
            msg = 'Formato de Email inválido'
        }

        // 2. Duplicate Check
        if (status === 'VALID') {
            let query = (supabase
                .from('user_profiles') as any)
                .select('id')
                .eq('tenant_id', (row as any).tenant_id) // Same tenant

            // Check by Email OR Rut
            if (rut) {
                query = query.or(`email.eq.${email},rut.eq.${rut}`)
            } else {
                query = query.eq('email', email)
            }

            const { data: existing } = await query.maybeSingle()

            if (existing) {
                status = 'DUPLICATE'
                msg = 'El socio ya existe (Coincidencia de Email o RUT)'
            }
        }

        // Update
        await (supabase
            .from('import_staging_socios') as any)
            .update({ status, validation_message: msg })
            .eq('id', (row as any).id)
    }

    return { success: true }
}

export async function commitBatch(batchId: string) {
    // 1. Get Admin Client
    const supabaseAdmin = createAdminClient()
    if (!supabaseAdmin) return { error: 'Cliente Admin no disponible' }

    // 2. Resolve Current User's Tenant (Source of Truth)
    // We strictly fetch the tenant_id of the person executing the commit to ensure records belong to them.
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) return { error: 'Unauthorized: No user found' }

    const { data: profile } = await (supabaseAdmin
        .from('user_profiles') as any)
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile || !profile.tenant_id) {
        return { error: 'Critical: Admin user has no valid Tenant ID. Import aborted to prevent orphaned records.' }
    }

    const targetTenantId = profile.tenant_id

    // 3. Select VALID rows
    const { data: rows } = await (supabaseAdmin
        .from('import_staging_socios') as any)
        .select('*')
        .eq('batch_id', batchId)
        .eq('status', 'VALID')

    if (!rows || rows.length === 0) return { count: 0 }

    // 4. Transform & Insert
    const newMembers = rows.map((r: any) => ({
        // TODO: This UUID is a placeholder to satisfy DB constraints. FUTURE: Replace or map this to the GoodBarber User ID when integration is active.
        id: crypto.randomUUID(),
        tenant_id: targetTenantId, // <--- EXPLICIT from verified profile, not relying on staging row
        full_name: r.raw_data.names + ' ' + r.raw_data.surnames, // Constructing full name
        email: r.raw_data.email,
        custom_data: r.raw_data.custom_data || {}, // Persist custom data
        rut: r.raw_data.rut, // <--- EXPLICIT: Official RUT column
        // Store standard fields that don't have columns in user_profiles into metadata
        metadata: {
            source: 'csv_import',
            // rut: r.raw_data.rut, // Removed: Now a first-class citizen
            imported_at: new Date().toISOString()
        }
    }))

    const { error } = await (supabaseAdmin.from('user_profiles') as any).insert(newMembers)

    if (error) return { error: error.message }

    // Cleanup
    await (supabaseAdmin.from('import_staging_socios') as any).delete().eq('batch_id', batchId)

    return { success: true, count: newMembers.length }
}

export async function getBatchSummary(batchId: string) {
    const supabase = createAdminClient()
    if (!supabase) return null

    const { data } = await (supabase.from('import_staging_socios') as any).select('status').eq('batch_id', batchId)

    if (!data) return null;

    return {
        total: data.length,
        valid: data.filter((r: any) => r.status === 'VALID').length,
        duplicate: data.filter((r: any) => r.status === 'DUPLICATE').length,
        error: data.filter((r: any) => r.status === 'ERROR').length,
        pending: data.filter((r: any) => r.status === 'PENDING').length,
    }
}

export async function getBatchRows(batchId: string) {
    const supabase = createAdminClient()
    if (!supabase) return []

    const { data } = await (supabase.from('import_staging_socios') as any).select('*').eq('batch_id', batchId).order('id')
    return data || []
}
