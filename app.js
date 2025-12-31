const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
require('dotenv').config() // Load .env file explicitly

// SAFE DIAGNOSTIC STARTUP LOGGING
console.log('--- ENV VAR DIAGNOSTIC ---')
console.log('PORT:', process.env.PORT || 'Not set (will use 3000)')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `PRESENT (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5)}...)` : 'MISSING')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? `PRESENT (${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5)}...)` : 'MISSING')
console.log('--------------------------')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            // Be sure to pass `true` as the second argument to `url.parse`.
            // This tells it to parse the query portion of the URL.
            const parsedUrl = parse(req.url, true)
            const { pathname, query } = parsedUrl

            if (pathname === '/api/health') {
                res.statusCode = 200
                res.end('OK')
                return
            }

            await handle(req, res, parsedUrl)
        } catch (err) {
            console.error('Error occurred handling', req.url, err)
            res.statusCode = 500
            res.end('internal server error')
        }
    })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`)
            console.log(`> Hostinger Port: ${process.env.PORT || 'Not Set (using default 3000)'}`)
        })
})
