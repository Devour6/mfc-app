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
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
}

// Mock @/lib/prisma
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))
