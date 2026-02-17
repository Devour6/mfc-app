/**
 * @jest-environment node
 */
import { mockPrisma, createRequest } from './helpers'

import { GET, POST } from '@/app/api/user/credits/route'

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET /api/user/credits ──────────────────────────────────────────────────

describe('GET /api/user/credits', () => {
  it('returns credit balance', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', credits: 500 })

    const res = await GET(createRequest('/api/user/credits?auth0Id=auth0|123'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.credits).toBe(500)
  })

  it('returns 400 if auth0Id missing', async () => {
    const res = await GET(createRequest('/api/user/credits'))

    expect(res.status).toBe(400)
  })

  it('returns 404 if user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const res = await GET(createRequest('/api/user/credits?auth0Id=auth0|nope'))

    expect(res.status).toBe(404)
  })
})

// ─── POST /api/user/credits — Add/deduct credits ───────────────────────────

describe('POST /api/user/credits', () => {
  it('adds credits to user balance', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', credits: 500 })
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', credits: 600 })

    const res = await POST(
      createRequest('/api/user/credits', {
        method: 'POST',
        body: JSON.stringify({
          auth0Id: 'auth0|123',
          amount: 100,
          type: 'deposit',
        }),
      })
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.credits).toBe(600)
    expect(data.transaction.amount).toBe(100)
    expect(data.transaction.type).toBe('deposit')
  })

  it('deducts credits from user balance', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', credits: 500 })
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', credits: 450 })

    const res = await POST(
      createRequest('/api/user/credits', {
        method: 'POST',
        body: JSON.stringify({
          auth0Id: 'auth0|123',
          amount: -50,
          type: 'withdrawal',
        }),
      })
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.credits).toBe(450)
  })

  it('rejects if balance would go negative', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', credits: 50 })

    const res = await POST(
      createRequest('/api/user/credits', {
        method: 'POST',
        body: JSON.stringify({
          auth0Id: 'auth0|123',
          amount: -100,
          type: 'withdrawal',
        }),
      })
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/insufficient credits/i)
  })

  it('rejects zero amount', async () => {
    const res = await POST(
      createRequest('/api/user/credits', {
        method: 'POST',
        body: JSON.stringify({
          auth0Id: 'auth0|123',
          amount: 0,
          type: 'deposit',
        }),
      })
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Validation failed')
  })

  it('returns 404 if user not found', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const res = await POST(
      createRequest('/api/user/credits', {
        method: 'POST',
        body: JSON.stringify({
          auth0Id: 'auth0|nope',
          amount: 100,
          type: 'deposit',
        }),
      })
    )

    expect(res.status).toBe(404)
  })
})
