/**
 * @jest-environment node
 */
import { mockPrisma, createRequest, params } from './helpers'

// Mock settlement engine — prevents real DB operations, verifies calls
jest.mock('@/lib/settlement-engine', () => ({
  settleFight: jest.fn().mockResolvedValue({
    settledPositions: 0, cancelledOrders: 0, totalPayouts: 0, totalFees: 0,
  }),
}))

import { GET, POST } from '@/app/api/fights/route'
import { GET as GET_BY_ID, POST as SUBMIT_RESULT, PATCH } from '@/app/api/fights/[id]/route'
import { settleFight as mockSettleFight } from '@/lib/settlement-engine'

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET /api/fights ────────────────────────────────────────────────────────

describe('GET /api/fights', () => {
  it('returns fights ordered by scheduledAt', async () => {
    const fights = [{ id: 'fight1', status: 'SCHEDULED' }]
    mockPrisma.fight.findMany.mockResolvedValue(fights)

    const res = await GET(createRequest('/api/fights'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(fights)
  })

  it('filters by status', async () => {
    mockPrisma.fight.findMany.mockResolvedValue([])

    await GET(createRequest('/api/fights?status=LIVE'))

    expect(mockPrisma.fight.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'LIVE' }) })
    )
  })
})

// ─── POST /api/fights ───────────────────────────────────────────────────────

describe('POST /api/fights', () => {
  it('creates a fight when both fighters exist and are active', async () => {
    mockPrisma.fighter.findUnique
      .mockResolvedValueOnce({ id: 'f1', isActive: true })
      .mockResolvedValueOnce({ id: 'f2', isActive: true })
    mockPrisma.fight.create.mockResolvedValue({
      id: 'fight1', fighter1Id: 'f1', fighter2Id: 'f2', status: 'SCHEDULED',
    })

    const res = await POST(
      createRequest('/api/fights', {
        method: 'POST',
        body: JSON.stringify({ fighter1Id: 'f1', fighter2Id: 'f2' }),
      })
    )

    expect(res.status).toBe(201)
  })

  it('computes FightTier from fighter stats and stores on fight', async () => {
    mockPrisma.fighter.findUnique
      .mockResolvedValueOnce({
        id: 'f1', isActive: true,
        strength: 85, speed: 70, defense: 75, stamina: 60, fightIQ: 65, aggression: 50,
      })
      .mockResolvedValueOnce({
        id: 'f2', isActive: true,
        strength: 50, speed: 55, defense: 60, stamina: 45, fightIQ: 40, aggression: 35,
      })
    mockPrisma.fight.create.mockResolvedValue({
      id: 'fight1', tier: 'REGIONAL', status: 'SCHEDULED',
    })

    const res = await POST(
      createRequest('/api/fights', {
        method: 'POST',
        body: JSON.stringify({ fighter1Id: 'f1', fighter2Id: 'f2' }),
      })
    )

    expect(res.status).toBe(201)
    // Fighter 1 max stat = 85 → REGIONAL
    expect(mockPrisma.fight.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tier: 'REGIONAL' }),
      })
    )
  })

  it('computes GRAND tier for fighter with stat 95+', async () => {
    mockPrisma.fighter.findUnique
      .mockResolvedValueOnce({
        id: 'f1', isActive: true,
        strength: 50, speed: 50, defense: 50, stamina: 50, fightIQ: 50, aggression: 50,
      })
      .mockResolvedValueOnce({
        id: 'f2', isActive: true,
        strength: 96, speed: 50, defense: 50, stamina: 50, fightIQ: 50, aggression: 50,
      })
    mockPrisma.fight.create.mockResolvedValue({
      id: 'fight1', tier: 'GRAND', status: 'SCHEDULED',
    })

    const res = await POST(
      createRequest('/api/fights', {
        method: 'POST',
        body: JSON.stringify({ fighter1Id: 'f1', fighter2Id: 'f2' }),
      })
    )

    expect(res.status).toBe(201)
    expect(mockPrisma.fight.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tier: 'GRAND' }),
      })
    )
  })

  it('defaults to LOCAL tier when no stats exceed 80', async () => {
    mockPrisma.fighter.findUnique
      .mockResolvedValueOnce({ id: 'f1', isActive: true })
      .mockResolvedValueOnce({ id: 'f2', isActive: true })
    mockPrisma.fight.create.mockResolvedValue({
      id: 'fight1', tier: 'LOCAL', status: 'SCHEDULED',
    })

    const res = await POST(
      createRequest('/api/fights', {
        method: 'POST',
        body: JSON.stringify({ fighter1Id: 'f1', fighter2Id: 'f2' }),
      })
    )

    expect(res.status).toBe(201)
    expect(mockPrisma.fight.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tier: 'LOCAL' }),
      })
    )
  })

  it('rejects if a fighter does not exist', async () => {
    mockPrisma.fighter.findUnique
      .mockResolvedValueOnce({ id: 'f1', isActive: true })
      .mockResolvedValueOnce(null)

    const res = await POST(
      createRequest('/api/fights', {
        method: 'POST',
        body: JSON.stringify({ fighter1Id: 'f1', fighter2Id: 'f2' }),
      })
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/not found/i)
  })

  it('rejects if a fighter is inactive', async () => {
    mockPrisma.fighter.findUnique
      .mockResolvedValueOnce({ id: 'f1', isActive: true })
      .mockResolvedValueOnce({ id: 'f2', isActive: false })

    const res = await POST(
      createRequest('/api/fights', {
        method: 'POST',
        body: JSON.stringify({ fighter1Id: 'f1', fighter2Id: 'f2' }),
      })
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/active/i)
  })
})

// ─── Fight Lifecycle: SCHEDULED → LIVE → COMPLETED ─────────────────────────

describe('Fight lifecycle (status transitions)', () => {
  it('transitions SCHEDULED → LIVE', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({ id: 'fight1', status: 'SCHEDULED' })
    mockPrisma.fight.update.mockResolvedValue({ id: 'fight1', status: 'LIVE', startedAt: new Date() })

    const res = await PATCH(
      createRequest('/api/fights/fight1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'LIVE' }),
      }),
      params('fight1')
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('LIVE')
    // Non-COMPLETED transitions do NOT trigger settlement
    expect(mockSettleFight).not.toHaveBeenCalled()
  })

  it('transitions LIVE → COMPLETED and triggers settlement', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({
      id: 'fight1', status: 'LIVE', tier: 'LOCAL', league: 'HUMAN',
      fighter1Id: 'f1', fighter2Id: 'f2',
    })
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.fight.update.mockResolvedValue({ id: 'fight1', status: 'COMPLETED', endedAt: new Date() })
    mockPrisma.fightResult.findFirst.mockResolvedValue({ winnerId: 'f1' })

    const res = await PATCH(
      createRequest('/api/fights/fight1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      }),
      params('fight1')
    )

    expect(res.status).toBe(200)
    expect(mockSettleFight).toHaveBeenCalledWith(
      expect.anything(), // tx client
      expect.objectContaining({
        fightId: 'fight1',
        outcome: { type: 'winner', side: 'YES' },
        fightTier: 'LOCAL',
        league: 'HUMAN',
      })
    )
  })

  it('settles as draw when no fight result exists', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({
      id: 'fight1', status: 'LIVE', tier: 'REGIONAL', league: 'HUMAN',
      fighter1Id: 'f1', fighter2Id: 'f2',
    })
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.fight.update.mockResolvedValue({ id: 'fight1', status: 'COMPLETED' })
    mockPrisma.fightResult.findFirst.mockResolvedValue(null)

    const res = await PATCH(
      createRequest('/api/fights/fight1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      }),
      params('fight1')
    )

    expect(res.status).toBe(200)
    expect(mockSettleFight).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        outcome: { type: 'draw' },
      })
    )
  })

  it('maps fighter2 winner to NO side', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({
      id: 'fight1', status: 'LIVE', tier: 'GRAND', league: 'HUMAN',
      fighter1Id: 'f1', fighter2Id: 'f2',
    })
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.fight.update.mockResolvedValue({ id: 'fight1', status: 'COMPLETED' })
    mockPrisma.fightResult.findFirst.mockResolvedValue({ winnerId: 'f2' })

    const res = await PATCH(
      createRequest('/api/fights/fight1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      }),
      params('fight1')
    )

    expect(res.status).toBe(200)
    expect(mockSettleFight).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        outcome: { type: 'winner', side: 'NO' },
      })
    )
  })

  it('rejects illegal transition SCHEDULED → COMPLETED', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({ id: 'fight1', status: 'SCHEDULED' })

    const res = await PATCH(
      createRequest('/api/fights/fight1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' }),
      }),
      params('fight1')
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/Cannot transition/)
    expect(mockSettleFight).not.toHaveBeenCalled()
  })

  it('rejects transition from COMPLETED (terminal state)', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({ id: 'fight1', status: 'COMPLETED' })

    const res = await PATCH(
      createRequest('/api/fights/fight1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'LIVE' }),
      }),
      params('fight1')
    )

    expect(res.status).toBe(400)
  })

  it('allows SCHEDULED → CANCELLED without settlement', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({ id: 'fight1', status: 'SCHEDULED' })
    mockPrisma.fight.update.mockResolvedValue({ id: 'fight1', status: 'CANCELLED' })

    const res = await PATCH(
      createRequest('/api/fights/fight1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' }),
      }),
      params('fight1')
    )

    expect(res.status).toBe(200)
    expect(mockSettleFight).not.toHaveBeenCalled()
  })
})

// ─── POST /api/fights/:id — Submit fight result ────────────────────────────

describe('POST /api/fights/:id (submit result)', () => {
  it('submits a result and updates fighter records', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({
      id: 'fight1', status: 'LIVE', maxRounds: 3, fighter1Id: 'f1', fighter2Id: 'f2',
    })
    const mockResult = { id: 'result1', method: 'KO', round: 2, winnerId: 'f1' }
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.fightResult.create.mockResolvedValue(mockResult)
    mockPrisma.fight.update.mockResolvedValue({})
    mockPrisma.fighter.update.mockResolvedValue({})

    const res = await SUBMIT_RESULT(
      createRequest('/api/fights/fight1', {
        method: 'POST',
        body: JSON.stringify({
          method: 'KO',
          round: 2,
          winnerId: 'f1',
                  }),
      }),
      params('fight1')
    )

    expect(res.status).toBe(201)
  })

  it('rejects if fight is already completed', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({ id: 'fight1', status: 'COMPLETED' })

    const res = await SUBMIT_RESULT(
      createRequest('/api/fights/fight1', {
        method: 'POST',
        body: JSON.stringify({ method: 'KO', winnerId: 'f1', userId: 'u1' }),
      }),
      params('fight1')
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/already completed/i)
  })

  it('rejects if round exceeds maxRounds', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({
      id: 'fight1', status: 'LIVE', maxRounds: 3, fighter1Id: 'f1', fighter2Id: 'f2',
    })

    const res = await SUBMIT_RESULT(
      createRequest('/api/fights/fight1', {
        method: 'POST',
        body: JSON.stringify({ method: 'KO', round: 5, winnerId: 'f1', userId: 'u1' }),
      }),
      params('fight1')
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/Round must be/)
  })

  it('rejects if winnerId is not a fighter in the fight', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({
      id: 'fight1', status: 'LIVE', maxRounds: 3, fighter1Id: 'f1', fighter2Id: 'f2',
    })

    const res = await SUBMIT_RESULT(
      createRequest('/api/fights/fight1', {
        method: 'POST',
        body: JSON.stringify({ method: 'KO', winnerId: 'f3', userId: 'u1' }),
      }),
      params('fight1')
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/Winner must be/)
  })
})

// ─── GET /api/fights/:id ────────────────────────────────────────────────────

describe('GET /api/fights/:id', () => {
  it('returns fight with details', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue({
      id: 'fight1', status: 'SCHEDULED', fighter1: {}, fighter2: {}, result: null, bets: [],
    })

    const res = await GET_BY_ID(createRequest('/api/fights/fight1'), params('fight1'))

    expect(res.status).toBe(200)
  })

  it('returns 404 for missing fight', async () => {
    mockPrisma.fight.findUnique.mockResolvedValue(null)

    const res = await GET_BY_ID(createRequest('/api/fights/nope'), params('nope'))

    expect(res.status).toBe(404)
  })
})
