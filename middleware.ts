import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // 1. Rate Limiting for sensitive routes
    const sensitiveRoutes = ['/api/validate-benefit', '/api/user/search', '/auth']
    const isSensitive = sensitiveRoutes.some(route => path.startsWith(route))

    if (isSensitive) {
        // Create a lightweight client just for the RPC call
        // We use env vars directly. Middleware runs on edge, so basic env vars should be there.
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) { /* No write needed for rate checking */ }
            }
        })

        const ip = request.headers.get('x-forwarded-for') || 'unknown'

        // RPC call to check_rate_limit
        // p_limit: 10 requests per minute (60 seconds)
        const { data: isAllowed, error } = await supabase.rpc('check_rate_limit', {
            p_ip_address: ip,
            p_endpoint: path,
            p_limit: 10,
            p_window_seconds: 60
        })

        // If RPC fails (e.g. function missing), we might fail open or closed.
        // Failing closed (deny) is safer, but if DB is down calls fail.
        // For now, if we get explicit false, we deny.
        if (isAllowed === false) {
            return new NextResponse('Too Many Requests', { status: 429 })
        }
    }

    // 2. Standard Session Update
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
