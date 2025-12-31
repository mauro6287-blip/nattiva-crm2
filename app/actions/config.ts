'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

interface IntegrationConfig {
    goodbarber?: {
        app_id: string
        api_key: string
    }
}

export async function updateTenantConfig(configData: IntegrationConfig) {
    console.log('[updateTenantConfig] Start processing...', configData);

    try {
        // 0. Initialize Admin Client Safely (Lazy Init)
        const supabaseAdmin = createAdminClient();

        if (!supabaseAdmin) {
            throw new Error('Error de configuración de servidor: Servicio no disponible (Admin Client Missing).');
        }

        // 1. Auth check
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('[updateTenantConfig] Auth Error:', authError);
            throw new Error('No autorizado: Sesión inválida o expirada.');
        }

        // 2. Get User's Tenant securely
        // We explicitly use single() to fail if multiple or none found, which helps debugging
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (profileError || !profile || !(profile as any).tenant_id) {
            console.error('[updateTenantConfig] Profile Error:', profileError);
            throw new Error('Usuario no tiene un sindicato asignado (Tenant ID no encontrado).');
        }
        const tenantId = (profile as any).tenant_id;

        // Optional: Check if user is admin
        const userRole = (profile as any).role;
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            throw new Error('Permisos insuficientes: Se requiere rol de administrador.');
        }

        // 3. Prepare Update Payload
        const updates = {
            goodbarber_app_id: configData.goodbarber?.app_id || null,
            goodbarber_api_key: configData.goodbarber?.api_key || null,
            updated_at: new Date().toISOString()
        }

        console.log('[updateTenantConfig] Sending update to Supabase:', { tenantId, updates });

        // 4. Update Tenant using Admin Client
        const { error: updateError } = await (supabaseAdmin
            .from('tenants') as any)
            .update(updates)
            .eq('id', tenantId)

        if (updateError) {
            console.error("DEBUG PROD ERROR:", updateError.message, updateError.code, updateError);
            throw new Error(`Error DB (${updateError.code}): ${updateError.message}`);
        }

        console.log('[updateTenantConfig] Success');
        revalidatePath('/dashboard/configuracion');

        return { success: true };

    } catch (error: any) {
        console.error("DEBUG PROD EXCEPTION:", error);
        // Explicitly return success: false as requested
        return { success: false, error: error.message || 'Error desconocido en el servidor' };
    }
}

export async function getTenantConfig() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { error: 'Unauthorized' }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile || !(profile as any).tenant_id) return { error: 'No tenant' }
        const tenantId = (profile as any).tenant_id

        // Use Admin client to bypass RLS on tenants table
        // Lazy Init Here too
        const supabaseAdmin = createAdminClient();

        if (!supabaseAdmin) {
            return { error: 'Servicio de configuración no disponible temporalmente.' };
        }

        // Select specific columns
        const { data: tenant, error } = await supabaseAdmin
            .from('tenants')
            .select('config, goodbarber_app_id, goodbarber_api_key')
            .eq('id', tenantId)
            .single()

        if (error || !tenant) {
            console.error('[getTenantConfig] Error:', error);
            return { error: 'Error fetching config' };
        }

        // Map back to the structure expected by frontend form
        // Priority: Specific Columns > JSON Config > Empty
        const t = tenant as any;
        const gbConfig = {
            app_id: t.goodbarber_app_id || t.config?.goodbarber?.app_id || '',
            api_key: t.goodbarber_api_key || t.config?.goodbarber?.api_key || ''
        }

        return {
            config: {
                goodbarber: gbConfig
            },
            success: true
        }
    } catch (error: any) {
        console.error("[getTenantConfig] Exception:", error);
        return { error: error.message, success: false }
    }
}
