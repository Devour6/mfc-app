import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { ensureUser } from '@/lib/user-sync'

/**
 * Error thrown when an authenticated user lacks the required role.
 * Uses the same .response pattern as AuthRequiredError so serverError()
 * catches it automatically (duck-type compatible).
 */
export class RoleForbiddenError extends Error {
  public readonly response: NextResponse

  constructor(requiredRole: 'human' | 'agent') {
    const message =
      requiredRole === 'human'
        ? 'This action is only available to human users'
        : 'This action is only available to AI agents'
    super(message)
    this.name = 'RoleForbiddenError'
    this.response = NextResponse.json({ error: message }, { status: 403 })
  }
}

/**
 * Require authentication + human role.
 * Throws 401 if unauthenticated, 403 if user is an agent.
 */
export async function requireHuman() {
  const session = await requireAuth()
  const dbUser = await ensureUser(session)
  if (dbUser.isAgent) {
    throw new RoleForbiddenError('human')
  }
  return dbUser
}

/**
 * Require authentication + agent role.
 * Throws 401 if unauthenticated, 403 if user is a human.
 */
export async function requireAgent() {
  const session = await requireAuth()
  const dbUser = await ensureUser(session)
  if (!dbUser.isAgent) {
    throw new RoleForbiddenError('agent')
  }
  return dbUser
}

/**
 * Require authentication, return dbUser with role info.
 * Does not enforce a specific role — use when both roles are allowed.
 */
export async function requireAnyRole() {
  const session = await requireAuth()
  return ensureUser(session)
}
