export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            providers: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    contact_email: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    name: string
                    contact_email?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    name?: string
                    contact_email?: string | null
                    created_at?: string
                }
            }
            tenants: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    subscription_status: string | null
                    status: 'draft' | 'active' | 'suspended'
                    config: Json | null
                    onboarding_step: number
                    slug: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    subscription_status?: string | null
                    status?: 'draft' | 'active' | 'suspended'
                    config?: Json | null
                    onboarding_step?: number
                    slug?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    subscription_status?: string | null
                    status?: 'draft' | 'active' | 'suspended'
                    config?: Json | null
                    onboarding_step?: number
                    slug?: string | null
                }
            }
            provider_branches: {
                Row: {
                    id: string
                    provider_id: string
                    name: string
                    address: string | null
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    provider_id: string
                    name: string
                    address?: string | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    provider_id?: string
                    name?: string
                    address?: string | null
                    is_active?: boolean
                    created_at?: string
                }
            }
            provider_users: {
                Row: {
                    id: string
                    provider_id: string
                    user_id: string | null
                    role: string
                    invited_email: string | null
                    invited_name: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    provider_id: string
                    user_id?: string | null
                    role?: string
                    invited_email?: string | null
                    invited_name?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    provider_id?: string
                    user_id?: string | null
                    role?: string
                    invited_email?: string | null
                    invited_name?: string | null
                    created_at?: string
                }
            }
            ticket_categories: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    sla_hours_response: number
                    sla_hours_resolution: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    name: string
                    sla_hours_response?: number
                    sla_hours_resolution?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    name?: string
                    sla_hours_response?: number
                    sla_hours_resolution?: number
                    created_at?: string
                }
            }
            tickets: {
                Row: {
                    id: string
                    tenant_id: string
                    user_id: string | null
                    category_id: string | null
                    priority: string | null
                    status: string | null
                    subject: string
                    sla_deadline: string | null
                    first_response_at: string | null
                    resolved_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    user_id?: string | null
                    category_id?: string | null
                    priority?: string | null
                    status?: string | null
                    subject: string
                    sla_deadline?: string | null
                    first_response_at?: string | null
                    resolved_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    user_id?: string | null
                    category_id?: string | null
                    priority?: string | null
                    status?: string | null
                    subject?: string
                    sla_deadline?: string | null
                    first_response_at?: string | null
                    resolved_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            ticket_messages: {
                Row: {
                    id: string
                    ticket_id: string
                    user_id: string | null
                    content: string
                    is_internal: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    ticket_id: string
                    user_id?: string | null
                    content: string
                    is_internal?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    ticket_id?: string
                    user_id?: string | null
                    content?: string
                    is_internal?: boolean
                    created_at?: string
                }
            }
            support_macros: {
                Row: {
                    id: string
                    tenant_id: string
                    title: string
                    content: string
                    usage_count: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    title: string
                    content: string
                    usage_count?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    title?: string
                    content?: string
                    usage_count?: number
                    created_at?: string
                }
            }
            user_profiles: {
                Row: {
                    id: string
                    tenant_id: string | null
                    full_name: string | null
                    email: string | null
                    avatar_url: string | null
                    rut: string | null
                    custom_data: Json | null
                    metadata: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    tenant_id?: string | null
                    full_name?: string | null
                    email?: string | null
                    avatar_url?: string | null
                    rut?: string | null
                    custom_data?: Json | null
                    metadata?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string | null
                    full_name?: string | null
                    email?: string | null
                    avatar_url?: string | null
                    rut?: string | null
                    custom_data?: Json | null
                    metadata?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            family_members: {
                Row: {
                    id: string
                    tenant_id: string
                    user_id: string
                    full_name: string
                    relationship: string
                    rut: string | null
                    birth_date: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    user_id: string
                    full_name: string
                    relationship: string
                    rut?: string | null
                    birth_date?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    user_id?: string
                    full_name?: string
                    relationship?: string
                    rut?: string | null
                    birth_date?: string | null
                    created_at?: string
                }
            }
            import_staging_socios: {
                Row: {
                    id: number
                    batch_id: string
                    tenant_id: string
                    raw_data: Json
                    status: 'PENDING' | 'VALID' | 'ERROR' | 'DUPLICATE'
                    validation_message: string | null
                    created_at: string
                }
                Insert: {
                    id?: number
                    batch_id: string
                    tenant_id: string
                    raw_data: Json
                    status?: 'PENDING' | 'VALID' | 'ERROR' | 'DUPLICATE'
                    validation_message?: string | null
                    created_at?: string
                }
                Update: {
                    id?: number
                    batch_id?: string
                    tenant_id?: string
                    raw_data?: Json
                    status?: 'PENDING' | 'VALID' | 'ERROR' | 'DUPLICATE'
                    validation_message?: string | null
                    created_at?: string
                }
            }
            audit_logs: {
                Row: {
                    id: string
                    tenant_id: string | null
                    actor_id: string | null
                    table_name: string
                    record_id: string
                    operation: 'INSERT' | 'UPDATE' | 'DELETE'
                    old_values: Json | null
                    new_values: Json | null
                    changed_fields: string[] | null
                    created_at: string
                    metadata: Json | null
                }
                Insert: {
                    id?: string
                    tenant_id?: string | null
                    actor_id?: string | null
                    table_name: string
                    record_id: string
                    operation: 'INSERT' | 'UPDATE' | 'DELETE'
                    old_values?: Json | null
                    new_values?: Json | null
                    changed_fields?: string[] | null
                    created_at?: string
                    metadata?: Json | null
                }
                Update: {
                    id?: string
                    tenant_id?: string | null
                    actor_id?: string | null
                    table_name?: string
                    record_id?: string
                    operation?: 'INSERT' | 'UPDATE' | 'DELETE'
                    old_values?: Json | null
                    new_values?: Json | null
                    changed_fields?: string[] | null
                    created_at?: string
                    metadata?: Json | null
                }
            }
        }
    },
    Views: {
        [_ in never]: never
    },
    Functions: {
        [_ in never]: never
    },
    Enums: {
        [_ in never]: never
    },
    CompositeTypes: {
        [_ in never]: never
    }
}
