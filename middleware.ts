import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge'

export default withMiddlewareAuthRequired()

export const config = {
  matcher: [
    '/api/fighters/:path*',
    '/api/training/:path*',
    '/api/fights/:path*',
    '/api/bets/:path*',
    '/api/user/:path*',
  ]
}