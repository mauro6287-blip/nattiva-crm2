'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function cleanupErroneousSocios() {
    const supabase = await createClient()

    // 1. Fetch IDs of profiles with source = 'Csv_import' in metadata
    // Note: filtering JSONB in Supabase can be tricky with simple query builders depending on version,
    // but .contains('metadata', { source: 'Csv_import' }) usually works.

    // Check if 'metadata' column exists and query it
    const { data: toDelete, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id, metadata')
        .contains('metadata', { source: 'Csv_import' })

    if (fetchError) {
        console.error('Error fetching erroneous socios:', fetchError)
        return { success: false, error: fetchError.message }
    }

    if (!toDelete || toDelete.length === 0) {
        return { success: true, count: 0, message: 'No se encontraron socios con origen Csv_import.' }
    }

    const ids = (toDelete as any[]).map(u => u.id)

    // 2. Delete them
    const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .in('id', ids)

    if (deleteError) {
        console.error('Error deleting socios:', deleteError)
        return { success: false, error: deleteError.message }
    }

    revalidatePath('/dashboard/socios')
    return { success: true, count: ids.length, message: `Se eliminaron ${ids.length} socios importados erróneamente.` }
}
