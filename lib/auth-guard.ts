import { NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'

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
 * Require authentication for an API route.
 * Throws AuthRequiredError if no session exists.
 * Returns the Auth0 session (with user.sub as the auth0Id).
 */
export async function requireAuth() {
  const session = await auth0.getSession()
  if (!session) throw new AuthRequiredError()
  return session
}
