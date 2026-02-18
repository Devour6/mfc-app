import { NextRequest } from 'next/server'

// ─── Request helpers ────────────────────────────────────────────────────────

export function createRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options as never)
}

export function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

// ─── Shared Prisma mock for API route tests ─────────────────────────────────
// Each test resets and configures these mocks as needed

export const mockPrisma = {
  fighter: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  fight: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  fightResult: {
    create: jest.fn(),
  },
  bet: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  apiKey: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  agentProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
}

// Mock @/lib/prisma
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Mock @/lib/auth0 — prevents Jest from importing ESM-only @auth0/nextjs-auth0
export const mockAuth0 = {
  getSession: jest.fn(),
}
jest.mock('@/lib/auth0', () => ({
  auth0: mockAuth0,
}))

// Default test session and user for auth-guarded routes
const defaultSession = { user: { sub: 'auth0|test-user', name: 'Test User', email: 'test@mfc.gg' } }
const defaultDbUser = { id: 'u1', auth0Id: 'auth0|test-user', credits: 10000, username: 'testuser', isAgent: false }
export const agentSession = { user: { sub: 'agent_abc123def456', name: 'TestBot', email: 'agent_abc123@agent.mfc.gg' }, isApiKey: true }
export const agentDbUser = { id: 'u-agent-1', auth0Id: 'agent_abc123def456', credits: 1000, username: null, isAgent: true }

// Mock @/lib/auth-guard — requireAuth returns a default session
export const mockRequireAuth = jest.fn().mockResolvedValue(defaultSession)
jest.mock('@/lib/auth-guard', () => {
  const { NextResponse } = require('next/server')
  return {
    requireAuth: mockRequireAuth,
    AuthRequiredError: class AuthRequiredError extends Error {
      public readonly response: InstanceType<typeof NextResponse>
      constructor() {
        super('Unauthorized')
        this.name = 'AuthRequiredError'
        this.response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    },
  }
})

// Mock @/lib/user-sync — ensureUser returns a default db user
export const mockEnsureUser = jest.fn().mockResolvedValue(defaultDbUser)
jest.mock('@/lib/user-sync', () => ({
  ensureUser: mockEnsureUser,
}))

// ─── Role guard mocks ──────────────────────────────────────────────────────
// Routes now use requireHuman/requireAgent/requireAnyRole from lib/role-guard
export const mockRequireHuman = jest.fn().mockResolvedValue(defaultDbUser)
export const mockRequireAgent = jest.fn().mockResolvedValue(agentDbUser)
export const mockRequireAnyRole = jest.fn().mockResolvedValue(defaultDbUser)
jest.mock('@/lib/role-guard', () => {
  const { NextResponse } = require('next/server')
  return {
    requireHuman: mockRequireHuman,
    requireAgent: mockRequireAgent,
    requireAnyRole: mockRequireAnyRole,
    RoleForbiddenError: class RoleForbiddenError extends Error {
      public readonly response: InstanceType<typeof NextResponse>
      constructor(requiredRole: 'human' | 'agent') {
        const message =
          requiredRole === 'human'
            ? 'This action is only available to human users'
            : 'This action is only available to AI agents'
        super(message)
        this.name = 'RoleForbiddenError'
        this.response = NextResponse.json({ error: message }, { status: 403 })
      }
    },
  }
})
