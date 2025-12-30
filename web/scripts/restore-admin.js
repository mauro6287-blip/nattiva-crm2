const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'; // From status.json

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log("Restoring Admin User...");

    const email = 'admin@sindicato.cl';
    const password = 'password123'; // Setting a known password
    const tenantId = '11111111-1111-1111-1111-111111111111';

    // 1. Create User in Auth
    let userId;
    const { data: listUsers } = await supabase.auth.admin.listUsers();
    const existingUser = listUsers.users.find(u => u.email === email);

    if (existingUser) {
        console.log("User already exists in Auth. Resetting password...");
        userId = existingUser.id;
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password: password, email_confirm: true });
        if (updateError) console.error("Error updating password:", updateError);
        else console.log("Password reset to:", password);
    } else {
        console.log("Creating new user...");
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });
        if (createError) {
            console.error("Error creating user:", createError);
            return;
        }
        userId = newUser.user.id;
        console.log("User created:", userId);
    }

    // 2. Ensure User Profile exists
    // We need to insert into public.user_profiles
    // We can try upsert
    console.log("Upserting User Profile...");
    const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
            id: userId,
            tenant_id: tenantId,
            email: email,
            full_name: 'Admin Restaurado',
            role_id: null // Or lookup 'admin' role if needed, but null is fine for now or we can query it
        });

    if (profileError) console.error("Error updating profile:", profileError);
    else console.log("Profile updated.");

    // 3. Link to Tenant (if explicit link needed beyond profile)
    // Our schema uses user_profiles.tenant_id as the main link.

    // 4. Ensure Role is assigned in user_profiles
    // Fetch admin role id
    const { data: roles } = await supabase.from('roles').select('id').eq('code', 'admin').single();
    if (roles) {
        console.log("Assigning Admin Role:", roles.id);
        await supabase.from('user_profiles').update({ role_id: roles.id }).eq('id', userId);
    }

    console.log("Done. Try logging in with:", email, password);
}

main();
