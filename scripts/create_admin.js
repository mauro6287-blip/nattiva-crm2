const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const output = async () => {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log('--- Checking Database Connectivity & Schema ---');

    // Check Tenants
    const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('*');

    if (tenantError) {
        console.error('CRITICAL: Error accessing tenants table:', tenantError.message);
    } else {
        console.log(`Success: Found ${tenants.length} tenants.`);
        if (tenants.length === 0) {
            console.log('Inserting seed tenant...');
            const { error: seedError } = await supabase.from('tenants').insert({
                id: '11111111-1111-1111-1111-111111111111',
                name: 'Sindicato Demo',
                slug: 'demo',
                status: 'active'
            });
            if (seedError) console.error('Error seeding tenant:', seedError);
            else console.log('Seed tenant inserted.');

            // Insert roles too if tenant inserted
            await supabase.from('roles').insert([
                { tenant_id: '11111111-1111-1111-1111-111111111111', code: 'admin', name: 'Administrador' },
                { tenant_id: '11111111-1111-1111-1111-111111111111', code: 'operador', name: 'Operador' }
            ]);
            console.log('Seed roles inserted.');
        }
    }

    console.log('\n--- Managed User Creation ---');
    const email = 'admin@sindicato.cl';
    const password = 'password123';

    // 1. Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const existingUser = users.find(u => u.email === email);
    let userId;

    if (existingUser) {
        console.log(`User found (ID: ${existingUser.id}). Updating password...`);
        userId = existingUser.id;
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: password, email_confirm: true }
        );

        if (updateError) console.error('Error updating password:', updateError);
        else console.log('Password updated successfully!');
    } else {
        console.log('User not found. Creating new user...');
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) {
            console.error('Error creating user:', createError);
            return;
        }
        else {
            console.log(`User created successfully! ID: ${data.user.id}`);
            userId = data.user.id;
        }
    }

    // Create Profile link if not exists
    if (userId) {
        // Needs tenant
        const { error: profileError } = await supabase.from('user_profiles').upsert({
            id: userId,
            tenant_id: '11111111-1111-1111-1111-111111111111',
            email: email,
            full_name: 'Admin User',
            role_id: (await supabase.from('roles').select('id').eq('code', 'admin').single()).data?.id
        });
        if (profileError) console.error('Error creating profile:', profileError);
        else console.log('User profile linked.');
    }
};

output();
