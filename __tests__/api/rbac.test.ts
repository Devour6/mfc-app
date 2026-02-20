/**
 * @jest-environment node
 *
 * RBAC Tests — verify that role guards enforce human/agent restrictions.
 * Human-only routes (bets) reject agents with 403.
 * Agent-only routes (fighters POST, training POST, fights POST) reject humans with 403.
 * Shared routes work for both roles.
 */
import {
  createRequest,
  params,
  mockPrisma,
  mockRequireHuman,
  mockRequireAgent,
  mockRequireAnyRole,
  agentDbUser,
} from './helpers'

// Import RoleForbiddenError for simulating role rejection
const { RoleForbiddenError } = jest.requireMock('@/lib/role-guard')

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── Human-only routes reject agents ────────────────────────────────────────

describe('RBAC: Human-only routes reject agents', () => {
  beforeEach(() => {
    // Make requireHuman throw RoleForbiddenError (simulates agent calling human-only route)
    mockRequireHuman.mockRejectedValue(new RoleForbiddenError('human'))
  })

  it('GET /api/bets returns 403 for agents', async () => {
    const { GET } = await import('@/app/api/bets/route')
    const req = createRequest('http://localhost:3000/api/bets')
    const res = await GET(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/human/)
  })

  it('POST /api/bets returns 403 for agents', async () => {
    const { POST } = await import('@/app/api/bets/route')
    const req = createRequest('http://localhost:3000/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fightId: 'f1', side: 'YES', amount: 100, odds: 1.5 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/human/)
  })

  it('GET /api/bets/:id returns 403 for agents', async () => {
    const { GET } = await import('@/app/api/bets/[id]/route')
    const req = createRequest('http://localhost:3000/api/bets/b1')
    const res = await GET(req, params('b1'))
    expect(res.status).toBe(403)
  })

  it('PATCH /api/bets/:id returns 403 for agents', async () => {
    const { PATCH } = await import('@/app/api/bets/[id]/route')
    const req = createRequest('http://localhost:3000/api/bets/b1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'WON', payout: 200 }),
    })
    const res = await PATCH(req, params('b1'))
    expect(res.status).toBe(403)
  })
})

// ─── Agent-only routes reject humans ────────────────────────────────────────

describe('RBAC: Agent-only routes reject humans', () => {
  beforeEach(() => {
    // Make requireAgent throw RoleForbiddenError (simulates human calling agent-only route)
    mockRequireAgent.mockRejectedValue(new RoleForbiddenError('agent'))
  })

  it('POST /api/fighters returns 403 for humans', async () => {
    const { POST } = await import('@/app/api/fighters/route')
    const req = createRequest('http://localhost:3000/api/fighters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Iron Claw', emoji: '🦀', fighterClass: 'MIDDLEWEIGHT' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/agent/)
  })

  // POST /api/training is now requireAnyRole() — humans can train too (time-gated, no credits)

  it('POST /api/fights returns 403 for humans', async () => {
    const { POST } = await import('@/app/api/fights/route')
    const req = createRequest('http://localhost:3000/api/fights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fighter1Id: 'f1', fighter2Id: 'f2' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/agent/)
  })

  it('POST /api/fights/:id (submit result) returns 403 for humans', async () => {
    const { POST } = await import('@/app/api/fights/[id]/route')
    const req = createRequest('http://localhost:3000/api/fights/f1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'KO' }),
    })
    const res = await POST(req, params('f1'))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/agent/)
  })
})

// ─── Shared routes allow both roles ─────────────────────────────────────────

describe('RBAC: Shared routes allow both roles', () => {
  it('GET /api/user works for humans', async () => {
    const { GET } = await import('@/app/api/user/route')
    mockRequireAnyRole.mockResolvedValue({ id: 'u1', auth0Id: 'auth0|test', credits: 1000, username: 'test', isAgent: false })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', name: 'Test', fighters: [] })
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it('GET /api/user works for agents', async () => {
    const { GET } = await import('@/app/api/user/route')
    mockRequireAnyRole.mockResolvedValue(agentDbUser)
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-agent-1', name: 'TestBot', fighters: [] })
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it('GET /api/user/credits works for humans', async () => {
    const { GET } = await import('@/app/api/user/credits/route')
    mockRequireAnyRole.mockResolvedValue({ id: 'u1', credits: 5000, isAgent: false })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.credits).toBe(5000)
  })

  it('GET /api/user/credits works for agents', async () => {
    const { GET } = await import('@/app/api/user/credits/route')
    mockRequireAnyRole.mockResolvedValue(agentDbUser)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.credits).toBe(1000)
  })
})
