import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const supabase = await createClient()

    let query = (supabase
        .from('content_items') as any)
        .select('id, title, summary, content_html, thumbnail_url, category, author_name, created_at, updated_at')
        .eq('status', 'publicado') // IMPORTANT: Only published content
        .order('created_at', { ascending: false })

    if (category) {
        query = query.eq('category', category)
    }

    const { data: items, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform to GoodBarber Custom Feed format
    const feedItems = items?.map((item: any) => ({
        id: item.id,
        type: "article",
        title: item.title,
        date: item.created_at, // ISO 8601
        summary: item.summary || '',
        author: item.author_name || 'Admin',
        thumbnail: item.thumbnail_url,
        content: item.content_html || '', // HTML content
        // Extra metadata if needed
        category: item.category
    })) || []

    return NextResponse.json({ items: feedItems })
}
