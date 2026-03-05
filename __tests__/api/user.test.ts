/**
 * @jest-environment node
 *
 * User profile endpoint tests — verifies:
 * 1. GET /api/user — returns authenticated user's profile with fighters
 * 2. POST /api/user — syncs user on login (returns user from role guard)
 * 3. PATCH /api/user — updates name and/or username with validation
 * 4. Auth checks — all endpoints require authentication
 * 5. Edge cases — user not found, validation failures, empty updates
 */

import {
  mockPrisma,
  mockRequireAnyRole,
  createRequest,
} from './helpers'

import { GET, POST, PATCH } from '@/app/api/user/route'

// ─── Fixtures ───────────────────────────────────────────────────────────────

const TEST_USER = {
  id: 'u1',
  auth0Id: 'auth0|test-user',
  credits: 10000,
  username: 'testuser',
  name: 'Test User',
  email: 'test@mfc.gg',
  isAgent: false,
}

const TEST_USER_WITH_FIGHTERS = {
  ...TEST_USER,
  fighters: [
    { id: 'f1', name: 'IRONCLAD-7', emoji: '🛡️', class: 'Heavyweight', elo: 1580, wins: 18, losses: 4, draws: 0 },
    { id: 'f2', name: 'PHANTOM', emoji: '👻', class: 'Lightweight', elo: 1650, wins: 20, losses: 5, draws: 0 },
  ],
}

// ─── GET /api/user ──────────────────────────────────────────────────────────

describe('GET /api/user', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAnyRole.mockResolvedValue(TEST_USER)
  })

  it('returns the authenticated user profile with fighters', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(TEST_USER_WITH_FIGHTERS)

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.id).toBe('u1')
    expect(data.username).toBe('testuser')
    expect(data.fighters).toHaveLength(2)
    expect(data.fighters[0].name).toBe('IRONCLAD-7')
  })

  it('queries for active fighters ordered by elo desc', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(TEST_USER_WITH_FIGHTERS)

    await GET()

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      include: {
        fighters: {
          where: { isActive: true },
          orderBy: { elo: 'desc' },
          select: { id: true, name: true, emoji: true, class: true, elo: true, wins: true, losses: true, draws: true },
        },
      },
    })
  })

  it('returns 404 when user not found in database', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toContain('User')
  })

  it('requires authentication', async () => {
    const { RoleForbiddenError } = jest.requireMock('@/lib/role-guard') as {
      RoleForbiddenError: new (role: 'human' | 'agent') => Error & { response: Response }
    }
    mockRequireAnyRole.mockRejectedValue(new RoleForbiddenError('human'))

    const res = await GET()
    expect(res.status).toBe(403)
  })
})

// ─── POST /api/user ─────────────────────────────────────────────────────────

describe('POST /api/user', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAnyRole.mockResolvedValue(TEST_USER)
  })

  it('returns the user from role guard (sync on login)', async () => {
    const res = await POST()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.id).toBe('u1')
    expect(data.username).toBe('testuser')
  })

  it('does not query Prisma directly (role guard handles sync)', async () => {
    await POST()

    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    const { RoleForbiddenError } = jest.requireMock('@/lib/role-guard') as {
      RoleForbiddenError: new (role: 'human' | 'agent') => Error & { response: Response }
    }
    mockRequireAnyRole.mockRejectedValue(new RoleForbiddenError('human'))

    const res = await POST()
    expect(res.status).toBe(403)
  })
})

// ─── PATCH /api/user ────────────────────────────────────────────────────────

describe('PATCH /api/user', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAnyRole.mockResolvedValue(TEST_USER)
  })

  it('updates username', async () => {
    mockPrisma.user.update.mockResolvedValue({ ...TEST_USER, username: 'newname' })

    const req = createRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ username: 'newname' }),
    })

    const res = await PATCH(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.username).toBe('newname')
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { username: 'newname' },
    })
  })

  it('updates name', async () => {
    mockPrisma.user.update.mockResolvedValue({ ...TEST_USER, name: 'New Name' })

    const req = createRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    })

    const res = await PATCH(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.name).toBe('New Name')
  })

  it('updates both name and username', async () => {
    mockPrisma.user.update.mockResolvedValue({ ...TEST_USER, name: 'Updated', username: 'updated_user' })

    const req = createRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated', username: 'updated_user' }),
    })

    const res = await PATCH(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.name).toBe('Updated')
    expect(data.username).toBe('updated_user')
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { name: 'Updated', username: 'updated_user' },
    })
  })

  it('rejects empty body (requires at least name or username)', async () => {
    const req = createRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })

    const res = await PATCH(req)
    expect(res.status).toBe(400)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects username shorter than 3 characters', async () => {
    const req = createRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ username: 'ab' }),
    })

    const res = await PATCH(req)
    expect(res.status).toBe(400)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects username longer than 20 characters', async () => {
    const req = createRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ username: 'a'.repeat(21) }),
    })

    const res = await PATCH(req)
    expect(res.status).toBe(400)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects username with invalid characters', async () => {
    const req = createRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ username: 'bad user!' }),
    })

    const res = await PATCH(req)
    expect(res.status).toBe(400)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('accepts username with hyphens and underscores', async () => {
    mockPrisma.user.update.mockResolvedValue({ ...TEST_USER, username: 'cool-user_123' })

    const req = createRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ username: 'cool-user_123' }),
    })

    const res = await PATCH(req)
    expect(res.status).toBe(200)
  })

  it('rejects name longer than 50 characters', async () => {
    const req = createRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'a'.repeat(51) }),
    })

    const res = await PATCH(req)
    expect(res.status).toBe(400)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects empty name string', async () => {
    const req = createRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ name: '' }),
    })

    const res = await PATCH(req)
    expect(res.status).toBe(400)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    const { RoleForbiddenError } = jest.requireMock('@/lib/role-guard') as {
      RoleForbiddenError: new (role: 'human' | 'agent') => Error & { response: Response }
    }
    mockRequireAnyRole.mockRejectedValue(new RoleForbiddenError('human'))

    const req = createRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ username: 'newname' }),
    })

    const res = await PATCH(req)
    expect(res.status).toBe(403)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })
})
