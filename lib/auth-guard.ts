import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth0 } from '@/lib/auth0'
import { prisma } from '@/lib/prisma'

/**
 * Error thrown when authentication is required but no session exists.
 * Route handlers should check for this in their catch blocks.
 */
export class AuthRequiredError extends Error {
  public readonly response: NextResponse

  constructor() {
    super('Unauthorized')
    this.name = 'AuthRequiredError'
    this.response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

/**
 * Unified session shape returned by requireAuth().
 * Both Auth0 sessions and API key auth produce this shape.
 */
export interface AuthSession {
  user: { sub: string; name?: string; email?: string }
  isApiKey?: boolean
}

/**
 * Require authentication for an API route.
 * 1. Try Auth0 session (browser users — fast, no DB call)
 * 2. Try API key from Authorization header (agents — DB lookup)
 * 3. Throw 401 if neither works
 *
 * Returns a session-like object compatible with ensureUser().
 */
export async function requireAuth(): Promise<AuthSession> {
  // Try Auth0 session first (fast, reads from cookies)
  const session = await auth0.getSession()
  if (session) return session as AuthSession

  // Try API key from Authorization header
  const headerStore = await headers()
  const authHeader = headerStore.get('authorization')
  if (authHeader?.startsWith('Bearer mfc_sk_')) {
    const key = authHeader.slice(7) // Remove "Bearer "
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: {
        user: {
          select: { id: true, auth0Id: true, email: true, name: true },
        },
      },
    })

    if (apiKey && apiKey.active) {
      // Update lastUsedAt (fire-and-forget, don't block the request)
      prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      }).catch(() => {})

      // Return session-like object that ensureUser() can consume
      return {
        user: {
          sub: apiKey.user.auth0Id,
          name: apiKey.user.name ?? undefined,
          email: apiKey.user.email,
        },
        isApiKey: true,
      }
    }
  }

  throw new AuthRequiredError()
}
