'use server'

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types_db'

// We need a direct Admin client wrapper because we might not have 'web/utils/supabase/admin' exposed as expected, 
// or I can try to import it if I find the correct path.
// For robustness, I will construct it here with process.env if I can't read the file.
// But best practice is to reuse if possible. Let's try to assume typical env vars.

const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

interface ProvisioningData {
    tenant: {
        name: string
        slug: string
        color?: string
        logoUrl?: string
    }
    admin: {
        email: string
        name: string
        password?: string // Auto-generated if not provided
    }
    config: {
        seedCategories: boolean
        seedMacros: boolean
        demoData: boolean
    }
}

export async function provisionTenant(data: ProvisioningData) {
    console.log('Starting Provisioning for:', data.tenant.name)

    // 1. Create Tenant Record
    const { data: tenant, error: tenantError } = await (supabaseAdmin
        .from('tenants') as any)
        .insert({
            name: data.tenant.name,
            slug: data.tenant.slug,
            // Storing extra config in JSONB
            config: {
                brandColor: data.tenant.color,
                logoUrl: data.tenant.logoUrl,
                features: {
                    crm: true,
                    tickets: true
                }
            },
            status: 'active', // Directly active for MVP, or 'draft' if we had a multi-step check
            // subscription_status: 'active' -- REMOVED to bypass PostgREST cache error (using DB default)
        })
        .select()
        .single()

    if (tenantError) {
        console.error('Tenant Creation Failed:', tenantError)
        return { error: `Failed to create tenant: ${tenantError.message}` }
    }

    console.log('Tenant Created:', tenant.id)

    // 2. Create Admin User (Auth)
    const tempPassword = data.admin.password || Math.random().toString(36).slice(-10) + 'Aa1!'

    // Check if user exists first? supabaseAdmin.auth.admin.createUser will fail if email exists.
    // We should handle that gracefully (maybe link to existing user?). For factories, unique email is usually expected.

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.admin.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
            full_name: data.admin.name
        }
    })

    if (authError) {
        console.error('Auth User Creation Failed:', authError)
        // Rollback Tenant?
        await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
        return { error: `Failed to create admin user: ${authError.message}` }
    }

    console.log('Admin Auth Created:', authUser.user.id)

    // 3. Create User Profile (Admin Role)
    const { error: profileError } = await (supabaseAdmin
        .from('user_profiles') as any)
        .upsert({ // upsert in case trigger created partial profile
            id: authUser.user.id,
            tenant_id: tenant.id,
            email: data.admin.email,
            full_name: data.admin.name,
            role: 'admin', // Critical
            metadata: { source: 'onboarding_wizard' }
        })

    if (profileError) {
        console.error('Profile Creation Failed:', profileError)
        // Hard to rollback Auth user easily without deleting it.
        return { error: `Failed to link admin profile: ${profileError.message}` }
    }

    // 4. Seeding
    if (data.config.seedCategories) {
        await (supabaseAdmin.from('ticket_categories') as any).insert([
            { tenant_id: tenant.id, name: 'Soporte General', sla_hours_resolution: 48 },
            { tenant_id: tenant.id, name: 'Pagos y Tesorería', sla_hours_resolution: 24 },
            { tenant_id: tenant.id, name: 'Urgencias Legales', sla_hours_resolution: 12 }
        ])
    }

    if (data.config.seedMacros) {
        await (supabaseAdmin.from('support_macros') as any).insert([
            { tenant_id: tenant.id, title: 'Bienvenida', content: 'Hola,\nGracias por escribirnos...' },
            { tenant_id: tenant.id, title: 'Cierre', content: 'El ticket ha sido cerrado.' }
        ])
    }

    if (data.config.demoData) {
        // Insert Fake Socios
        const { data: socios } = await (supabaseAdmin.from('user_profiles') as any).insert([
            { id: crypto.randomUUID(), tenant_id: tenant.id, email: `demo1_${tenant.slug}@example.com`, full_name: 'Juan Demo', role: 'user' },
            { id: crypto.randomUUID(), tenant_id: tenant.id, email: `demo2_${tenant.slug}@example.com`, full_name: 'Maria Demo', role: 'user' },
            { id: crypto.randomUUID(), tenant_id: tenant.id, email: `demo3_${tenant.slug}@example.com`, full_name: 'Pedro Demo', role: 'user' }
        ]).select()

        // Insert Fake Tickets
        if (socios && socios.length > 0) {
            await (supabaseAdmin.from('tickets') as any).insert([
                { tenant_id: tenant.id, user_id: socios[0].id, subject: 'Ayuda con mi clave', priority: 'high', status: 'new' },
                { tenant_id: tenant.id, user_id: socios[1].id, subject: 'Duda beneficios', priority: 'medium', status: 'open' }
            ])
        }
    }

    return {
        success: true,
        credentials: {
            email: data.admin.email,
            password: tempPassword,
            tenantId: tenant.id,
            loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
        }
    }
}
