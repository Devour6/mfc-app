/**
 * @jest-environment node
 */
import { mockPrisma, mockRequireAuth, mockEnsureUser, mockRequireHuman, mockRequireAgent, mockRequireAnyRole, createRequest, params } from './helpers'

import { GET as GET_fighters, POST as POST_fighters } from '@/app/api/fighters/route'
import { GET as GET_fighter, PATCH as PATCH_fighter } from '@/app/api/fighters/[id]/route'
import { GET as GET_fights, POST as POST_fights } from '@/app/api/fights/route'
import { GET as GET_fight, POST as POST_fight_result, PATCH as PATCH_fight } from '@/app/api/fights/[id]/route'
import { GET as GET_bets, POST as POST_bets } from '@/app/api/bets/route'
import { GET as GET_bet, PATCH as PATCH_bet } from '@/app/api/bets/[id]/route'
import { GET as GET_user, POST as POST_user, PATCH as PATCH_user } from '@/app/api/user/route'
import { GET as GET_credits, POST as POST_credits } from '@/app/api/user/credits/route'
import { GET as GET_training, POST as POST_training } from '@/app/api/training/route'
import { GET as GET_training_detail } from '@/app/api/training/[id]/route'
import { GET as GET_health } from '@/app/api/health/route'

beforeEach(() => {
  jest.clearAllMocks()
  // Default: auth succeeds
  mockRequireAuth.mockResolvedValue({
    user: { sub: 'auth0|test-user', name: 'Test User', email: 'test@mfc.gg' },
  })
  mockEnsureUser.mockResolvedValue({
    id: 'u1', auth0Id: 'auth0|test-user', credits: 10000, username: 'testuser', isAgent: false,
  })
  // Role guard defaults
  mockRequireHuman.mockResolvedValue({
    id: 'u1', auth0Id: 'auth0|test-user', credits: 10000, username: 'testuser', isAgent: false,
  })
  mockRequireAgent.mockResolvedValue({
    id: 'u-agent-1', auth0Id: 'agent_abc123def456', credits: 1000, username: null, isAgent: true,
  })
  mockRequireAnyRole.mockResolvedValue({
    id: 'u1', auth0Id: 'auth0|test-user', credits: 10000, username: 'testuser', isAgent: false,
  })
})

// Helper: simulate unauthenticated request
function simulateUnauthenticated() {
  const { AuthRequiredError } = jest.requireMock('@/lib/auth-guard')
  const authErr = new AuthRequiredError()
  mockRequireAuth.mockRejectedValue(authErr)
  // Role guards also reject since they call requireAuth internally
  mockRequireHuman.mockRejectedValue(authErr)
  mockRequireAgent.mockRejectedValue(authErr)
  mockRequireAnyRole.mockRejectedValue(authErr)
}

// ─── Public routes — should work WITHOUT auth ────────────────────────────────

describe('Public routes (no auth required)', () => {
  beforeEach(() => {
    simulateUnauthenticated()
  })

  it('GET /api/fighters works without auth', async () => {
    mockPrisma.fighter.findMany.mockResolvedValue([])
    const res = await GET_fighters(createRequest('/api/fighters'))
    expect(res.status).toBe(200)
  })

  it('GET /api/fighters/:id works without auth', async () => {
    mockPrisma.fighter.findUnique.mockResolvedValue({ id: 'f1', name: 'Test' })
    const res = await GET_fighter(createRequest('/api/fighters/f1'), params('f1'))
    expect(res.status).toBe(200)
  })

  it('GET /api/fights works without auth', async () => {
    mockPrisma.fight.findMany.mockResolvedValue([])
    const res = await GET_fights(createRequest('/api/fights'))
    expect(res.status).toBe(200)
  })

  it('GET /api/fights/:id works without auth', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({
      id: 'fight1', status: 'SCHEDULED', fighter1: {}, fighter2: {}, result: null, bets: [],
    })
    const res = await GET_fight(createRequest('/api/fights/fight1'), params('fight1'))
    expect(res.status).toBe(200)
  })

  it('GET /api/health works without auth', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }])
    const res = await GET_health()
    expect(res.status).toBe(200)
  })
})

// ─── Protected routes — should return 401 without auth ───────────────────────

describe('Protected routes return 401 when unauthenticated', () => {
  beforeEach(() => {
    simulateUnauthenticated()
  })

  // Fighters
  it('POST /api/fighters returns 401', async () => {
    const res = await POST_fighters(
      createRequest('/api/fighters', {
        method: 'POST',
        body: JSON.stringify({ name: 'Iron Mike', emoji: '🥊', fighterClass: 'HEAVYWEIGHT' }),
      })
    )
    expect(res.status).toBe(401)
  })

  it('PATCH /api/fighters/:id returns 401', async () => {
    const res = await PATCH_fighter(
      createRequest('/api/fighters/f1', {
        method: 'PATCH',
        body: JSON.stringify({ elo: 1250 }),
      }),
      params('f1')
    )
    expect(res.status).toBe(401)
  })

  // Fights
  it('POST /api/fights returns 401', async () => {
    const res = await POST_fights(
      createRequest('/api/fights', {
        method: 'POST',
        body: JSON.stringify({ fighter1Id: 'f1', fighter2Id: 'f2' }),
      })
    )
    expect(res.status).toBe(401)
  })

  it('POST /api/fights/:id (submit result) returns 401', async () => {
    const res = await POST_fight_result(
      createRequest('/api/fights/fight1', {
        method: 'POST',
        body: JSON.stringify({ method: 'KO', winnerId: 'f1' }),
      }),
      params('fight1')
    )
    expect(res.status).toBe(401)
  })

  it('PATCH /api/fights/:id (update status) returns 401', async () => {
    const res = await PATCH_fight(
      createRequest('/api/fights/fight1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'LIVE' }),
      }),
      params('fight1')
    )
    expect(res.status).toBe(401)
  })

  // User
  it('GET /api/user returns 401', async () => {
    const res = await GET_user()
    expect(res.status).toBe(401)
  })

  it('POST /api/user returns 401', async () => {
    const res = await POST_user()
    expect(res.status).toBe(401)
  })

  it('PATCH /api/user returns 401', async () => {
    const res = await PATCH_user(
      createRequest('/api/user', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New Name' }),
      })
    )
    expect(res.status).toBe(401)
  })

  // Credits
  it('GET /api/user/credits returns 401', async () => {
    const res = await GET_credits()
    expect(res.status).toBe(401)
  })

  it('POST /api/user/credits returns 401', async () => {
    const res = await POST_credits(
      createRequest('/api/user/credits', {
        method: 'POST',
        body: JSON.stringify({ amount: 100, type: 'deposit' }),
      })
    )
    expect(res.status).toBe(401)
  })

  // Bets
  it('GET /api/bets returns 401', async () => {
    const res = await GET_bets(createRequest('/api/bets'))
    expect(res.status).toBe(401)
  })

  it('POST /api/bets returns 401', async () => {
    const res = await POST_bets(
      createRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify({ fightId: 'fight1', side: 'YES', amount: 50, odds: 2.0 }),
      })
    )
    expect(res.status).toBe(401)
  })

  it('GET /api/bets/:id returns 401', async () => {
    const res = await GET_bet(createRequest('/api/bets/b1'), params('b1'))
    expect(res.status).toBe(401)
  })

  it('PATCH /api/bets/:id returns 401', async () => {
    const res = await PATCH_bet(
      createRequest('/api/bets/b1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'WON', payout: 100 }),
      }),
      params('b1')
    )
    expect(res.status).toBe(401)
  })

  // Training
  it('GET /api/training returns 401', async () => {
    const res = await GET_training(createRequest('/api/training'))
    expect(res.status).toBe(401)
  })

  it('POST /api/training returns 401', async () => {
    const res = await POST_training(
      createRequest('/api/training', {
        method: 'POST',
        body: JSON.stringify({ fighterId: 'f1', hours: 2 }),
      })
    )
    expect(res.status).toBe(401)
  })

  it('GET /api/training/:id returns 401', async () => {
    const res = await GET_training_detail(createRequest('/api/training/t1'), params('t1'))
    expect(res.status).toBe(401)
  })
})

// ─── User sync — role guards called on authenticated requests ────────────────

describe('User sync (role guards)', () => {
  it('POST /api/user calls requireAnyRole', async () => {
    const res = await POST_user()
    expect(res.status).toBe(200)
    expect(mockRequireAnyRole).toHaveBeenCalled()
  })

  it('GET /api/user/credits uses requireAnyRole for identity', async () => {
    const res = await GET_credits()
    expect(res.status).toBe(200)
    expect(mockRequireAnyRole).toHaveBeenCalled()
    const data = await res.json()
    expect(data.credits).toBe(10000)
  })
})
