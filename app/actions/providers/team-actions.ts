'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { Database } from "@/types_db"

export type ProviderUser = {
    id: string
    provider_id: string
    user_id: string | null
    role: string
    invited_email: string | null
    invited_name: string | null
    created_at: string
    // Joined user details (if available)
    user_details?: {
        email?: string
        full_name?: string
    }
}

export async function getProviderTeam(providerId: string): Promise<ProviderUser[]> {
    const supabase = await createClient()

    // We need to fetch provider_users and potentially join with user_profiles or auth data if user_id is present.
    // However, since user_id links to auth.users which is not easily joinable via standard postgrest without specific config,
    // we might rely on 'invited_email' for now or fetch profiles if we have a profiles table synced.
    // In this system `user_profiles` is the main profile table.

    // Let's try to join with user_profiles if possible.
    // public.provider_users has user_id which references auth.users. 
    // public.user_profiles also references auth.users via proper ID? Yes.

    const { data: team, error } = await (supabase
        .from('provider_users') as any)
        .select(`
            *,
            user_profiles:user_id (
                email,
                full_name
            )
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching team:', error)
        return []
    }

    // Map/Transform if needed
    return team.map((member: any) => ({
        ...member,
        user_details: member.user_profiles
    }))
}

export async function addProviderUser(providerId: string, email: string, role: string, name: string) {
    const supabase = await createClient()

    // 1. Check if user already exists in user_profiles to link immediately?
    // Optimization: Try to find user by email in user_profiles
    let userId = null
    const { data: existingUser } = await (supabase
        .from('user_profiles') as any)
        .select('id')
        .eq('email', email)
        .single()

    if (existingUser) {
        userId = existingUser.id
    }

    // 2. Insert
    const { error } = await (supabase
        .from('provider_users') as any)
        .insert({
            provider_id: providerId,
            user_id: userId,
            invited_email: email,
            invited_name: name,
            role: role
        })

    if (error) {
        if (error.code === '23505') return { error: 'Este usuario ya es parte del equipo.' }
        return { error: error.message }
    }

    revalidatePath('/dashboard/portal-proveedor')
    return { success: true }
}

export async function removeProviderUser(memberId: string) {
    const supabase = await createClient()

    const { error } = await (supabase
        .from('provider_users') as any)
        .delete()
        .eq('id', memberId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/portal-proveedor')
    return { success: true }
}
