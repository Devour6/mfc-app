// Temporarily disabled Auth0 middleware for development
// import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // For now, just pass through all requests
  // TODO: Re-enable Auth0 middleware when auth is properly configured
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/fighters/:path*',
    '/api/training/:path*',
    '/api/fights/:path*',
    '/api/bets/:path*',
    '/api/user/:path*',
  ]
}
