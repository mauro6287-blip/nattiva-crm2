import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const results: any = {};

    // 1. TEST ENV VARIABLES (HOSTINGER LEGACY)
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING';
    const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'MISSING';

    try {
        if (envUrl === 'MISSING' || envKey === 'MISSING') {
            throw new Error('Environment variables missing');
        }

        // Clean URL
        const cleanUrl = envUrl.trim().replace(/\/$/, "");

        const client = createClient(cleanUrl, envKey, { auth: { persistSession: false } });
        // Use auth.getSession as a cheap ping that doesn't rely on table existence/RLS as much involved
        // But for Service Key, we can try querying a table.
        // Let's use a known public table or just check if we can initialize.
        // Actually, invalid API key fails immediately on request.
        const { error } = await client.from('tenants').select('count', { count: 'exact', head: true });

        if (error) throw error;
        results.env_test = { status: 'SUCCESS', type: 'Legacy (Env)', url: cleanUrl };
    } catch (e: any) {
        results.env_test = { status: 'FAILED', error: e.message || 'Unknown', type: 'Legacy (Env)', url: envUrl };
    }

    // 2. TEST HARD CODED V2 KEYS (From History)
    // Only if URL is correct now, these MIGHT work.
    const v2_url = 'https://pxfucuiqtktgwspvpffh.supabase.co';
    const v2_key = 'sb_secret_OJOv-kxfDWjoShlQpoutsw_tyDkFNrN';

    try {
        const client = createClient(v2_url, v2_key, { auth: { persistSession: false } });
        const { error } = await client.from('tenants').select('count', { count: 'exact', head: true });

        if (error) throw error;
        results.v2_test = { status: 'SUCCESS', type: 'V2 (SB_)', url: v2_url };
    } catch (e: any) {
        results.v2_test = { status: 'FAILED', error: e.message || 'Unknown', type: 'V2 (SB_)', url: v2_url };
    }

    return NextResponse.json(results);
}
