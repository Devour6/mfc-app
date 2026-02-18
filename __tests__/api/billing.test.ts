/**
 * @jest-environment node
 */
import {
  mockPrisma,
  createRequest,
  params,
  mockRequireHuman,
  mockRequireAgent,
  mockRequireAnyRole,
  agentDbUser,
} from './helpers'

import { GET, POST } from '@/app/api/billing/requests/route'
import { PATCH } from '@/app/api/billing/requests/[id]/route'

beforeEach(() => {
  jest.clearAllMocks()
})

const defaultDbUser = { id: 'u1', auth0Id: 'auth0|test-user', credits: 10000, username: 'testuser', isAgent: false }

// ─── GET /api/billing/requests ───────────────────────────────────────────────

describe('GET /api/billing/requests', () => {
  it('returns billing requests for human owner', async () => {
    mockRequireAnyRole.mockResolvedValueOnce(defaultDbUser)
    const requests = [{ id: 'br1', amount: 500, status: 'PENDING' }]
    mockPrisma.billingRequest.findMany.mockResolvedValue(requests)

    const res = await GET(createRequest('/api/billing/requests'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(requests)
    expect(mockPrisma.billingRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: 'u1' } })
    )
  })

  it('returns billing requests for agent', async () => {
    mockRequireAnyRole.mockResolvedValueOnce(agentDbUser)
    mockPrisma.agentProfile.findUnique.mockResolvedValue({ id: 'ap1' })
    const requests = [{ id: 'br2', amount: 200 }]
    mockPrisma.billingRequest.findMany.mockResolvedValue(requests)

    const res = await GET(createRequest('/api/billing/requests'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(requests)
    expect(mockPrisma.billingRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { agentId: 'ap1' } })
    )
  })

  it('returns 404 when agent has no profile', async () => {
    mockRequireAnyRole.mockResolvedValueOnce(agentDbUser)
    mockPrisma.agentProfile.findUnique.mockResolvedValue(null)

    const res = await GET(createRequest('/api/billing/requests'))
    expect(res.status).toBe(404)
  })
})

// ─── POST /api/billing/requests ──────────────────────────────────────────────

describe('POST /api/billing/requests', () => {
  it('creates a billing request as agent', async () => {
    mockPrisma.agentProfile.findUnique.mockResolvedValue({ id: 'ap1', ownerId: 'u1' })
    const created = { id: 'br1', amount: 500, reason: 'Training costs', status: 'PENDING' }
    mockPrisma.billingRequest.create.mockResolvedValue(created)

    const res = await POST(
      createRequest('/api/billing/requests', {
        method: 'POST',
        body: JSON.stringify({ amount: 500, reason: 'Training costs' }),
      })
    )

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.amount).toBe(500)
  })

  it('returns 400 when agent has no owner', async () => {
    mockPrisma.agentProfile.findUnique.mockResolvedValue({ id: 'ap1', ownerId: null })

    const res = await POST(
      createRequest('/api/billing/requests', {
        method: 'POST',
        body: JSON.stringify({ amount: 500, reason: 'Need credits' }),
      })
    )

    expect(res.status).toBe(400)
  })

  it('rejects invalid payload', async () => {
    const res = await POST(
      createRequest('/api/billing/requests', {
        method: 'POST',
        body: JSON.stringify({ amount: -10, reason: '' }),
      })
    )

    expect(res.status).toBe(400)
  })

  it('returns 403 for human users', async () => {
    const { RoleForbiddenError } = jest.requireMock('@/lib/role-guard')
    mockRequireAgent.mockRejectedValueOnce(new RoleForbiddenError('agent'))

    const res = await POST(
      createRequest('/api/billing/requests', {
        method: 'POST',
        body: JSON.stringify({ amount: 500, reason: 'Need credits' }),
      })
    )

    expect(res.status).toBe(403)
  })
})

// ─── PATCH /api/billing/requests/:id ─────────────────────────────────────────

describe('PATCH /api/billing/requests/:id', () => {
  const pendingRequest = {
    id: 'br1',
    amount: 500,
    status: 'PENDING',
    ownerId: 'u1',
    agent: { userId: 'u-agent-1' },
  }

  it('approves a billing request and transfers credits', async () => {
    mockPrisma.billingRequest.findUnique.mockResolvedValue(pendingRequest)
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', credits: 10000 })
    mockPrisma.user.update.mockResolvedValue({})
    mockPrisma.billingRequest.update.mockResolvedValue({ ...pendingRequest, status: 'PAID' })

    const res = await PATCH(
      createRequest('/api/billing/requests/br1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      }),
      params('br1')
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('PAID')
  })

  it('rejects a billing request', async () => {
    mockPrisma.billingRequest.findUnique.mockResolvedValue(pendingRequest)
    mockPrisma.billingRequest.update.mockResolvedValue({ ...pendingRequest, status: 'REJECTED' })

    const res = await PATCH(
      createRequest('/api/billing/requests/br1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'REJECTED' }),
      }),
      params('br1')
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('REJECTED')
  })

  it('returns 404 for non-existent request', async () => {
    mockPrisma.billingRequest.findUnique.mockResolvedValue(null)

    const res = await PATCH(
      createRequest('/api/billing/requests/bad', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      }),
      params('bad')
    )

    expect(res.status).toBe(404)
  })

  it('returns 403 when owner does not match', async () => {
    mockPrisma.billingRequest.findUnique.mockResolvedValue({
      ...pendingRequest,
      ownerId: 'u-other',
    })

    const res = await PATCH(
      createRequest('/api/billing/requests/br1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      }),
      params('br1')
    )

    expect(res.status).toBe(403)
  })

  it('returns 400 for already resolved request', async () => {
    mockPrisma.billingRequest.findUnique.mockResolvedValue({
      ...pendingRequest,
      status: 'PAID',
    })

    const res = await PATCH(
      createRequest('/api/billing/requests/br1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      }),
      params('br1')
    )

    expect(res.status).toBe(400)
  })

  it('returns 400 for insufficient credits on approval', async () => {
    mockPrisma.billingRequest.findUnique.mockResolvedValue(pendingRequest)
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', credits: 100 })

    const res = await PATCH(
      createRequest('/api/billing/requests/br1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      }),
      params('br1')
    )

    expect(res.status).toBe(400)
  })
})
