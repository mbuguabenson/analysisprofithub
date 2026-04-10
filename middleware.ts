import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // ✅ CRITICAL: CSP header allows Deriv OAuth authentication
  // Added auth.deriv.com to frame-src to allow OAuth login window
  const cspHeader = [
    "frame-src 'self'",
    "http://localhost:*",
    "https://*.vusercontent.net/",
    "https://*.lite.vusercontent.net/",
    "https://generated.vusercontent.net/",
    "https://*.vercel.run/",
    "https://*.vercel.app/",
    "https://*.vercel.sh/",
    "https://vercel.live/",
    "https://vercel.com",
    "https://vercel.fides-cdn.ethyca.com/",
    "https://js.stripe.com/",
    "https://*.accounts.dev",
    "https://*.clerk.accounts.dev",
    "https://ops.askchapter.org",
    "https://auth.deriv.com/", // ✅ DERIV OAUTH
  ].join(' ')

  response.headers.set('Content-Security-Policy', cspHeader)

  return response
}

export const config = {
  matcher: ['/:path*'],
}
