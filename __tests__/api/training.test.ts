import { createRequest, params, mockPrisma, mockRequireAnyRole } from './helpers'

// Import route handlers
const trainingListRoute = () => import('@/app/api/training/route')
const trainingDetailRoute = () => import('@/app/api/training/[id]/route')

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireAnyRole.mockResolvedValue({ id: 'u1', auth0Id: 'auth0|test-user', credits: 10000, username: 'testuser', isAgent: false })
})

// ─── GET /api/training ──────────────────────────────────────────────────────

describe('GET /api/training', () => {
  it('returns a list of training sessions with progress', async () => {
    const now = new Date()
    const trainings = [
      {
        id: 't1', durationMinutes: 15, status: 'ACTIVE', startedAt: new Date(now.getTime() - 5 * 60 * 1000),
        completedAt: null, hours: null, cost: null,
        strengthGain: 0, speedGain: 0, defenseGain: 0, staminaGain: 0, fightIQGain: 0, aggressionGain: 0,
        fighterId: 'f1', userId: 'u1',
        fighter: { id: 'f1', name: 'Brawler', emoji: '🥊', class: 'HEAVYWEIGHT' },
        createdAt: now,
      },
    ]
    mockPrisma.training.findMany.mockResolvedValue(trainings)

    const { GET } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].progress).toBeGreaterThan(0)
    expect(data[0].progress).toBeLessThan(1)
    expect(data[0].isComplete).toBe(false)
    expect(data[0].timeRemainingSeconds).toBeGreaterThan(0)
  })

  it('filters by status query param', async () => {
    mockPrisma.training.findMany.mockResolvedValue([])

    const { GET } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training?status=ACTIVE')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(mockPrisma.training.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', status: 'ACTIVE' } })
    )
  })

  it('filters by fighterId query param', async () => {
    mockPrisma.training.findMany.mockResolvedValue([])

    const { GET } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training?fighterId=f1')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(mockPrisma.training.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', fighterId: 'f1' } })
    )
  })

  it('returns 401 when unauthenticated', async () => {
    const { NextResponse } = require('next/server')
    mockRequireAnyRole.mockRejectedValue(
      Object.assign(new Error('Unauthorized'), {
        name: 'AuthRequiredError',
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      })
    )

    const { GET } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })
})

// ─── POST /api/training ─────────────────────────────────────────────────────

describe('POST /api/training', () => {
  const validBody = { fighterId: 'f1', durationMinutes: 15 }
  const fighter = {
    id: 'f1', name: 'Brawler', ownerId: 'u1', isActive: true, trainingCost: 100,
    strength: 50, speed: 50, defense: 50, stamina: 50, fightIQ: 50, aggression: 50,
  }

  it('creates a time-gated training session (201)', async () => {
    mockPrisma.fighter.findUnique.mockResolvedValue(fighter)
    mockPrisma.training.findFirst.mockResolvedValue(null) // no active session
    mockPrisma.training.count.mockResolvedValue(0) // no sessions today
    const createdTraining = {
      id: 't-new', durationMinutes: 15, status: 'ACTIVE',
      startedAt: new Date(), completedAt: null,
      fighterId: 'f1', userId: 'u1',
      strengthGain: 0, speedGain: 0, defenseGain: 0,
      staminaGain: 0, fightIQGain: 0, aggressionGain: 0,
    }
    mockPrisma.training.create.mockResolvedValue(createdTraining)

    const { POST } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('t-new')
    expect(data.status).toBe('ACTIVE')
    expect(data.durationMinutes).toBe(15)
  })

  it('returns 400 for invalid durationMinutes', async () => {
    const { POST } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training', {
      method: 'POST',
      body: JSON.stringify({ fighterId: 'f1', durationMinutes: 10 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 for missing durationMinutes', async () => {
    const { POST } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training', {
      method: 'POST',
      body: JSON.stringify({ fighterId: 'f1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('returns 404 when fighter not found', async () => {
    mockPrisma.fighter.findUnique.mockResolvedValue(null)

    const { POST } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(404)
  })

  it('rejects training on another user\'s fighter', async () => {
    mockPrisma.fighter.findUnique.mockResolvedValue({ ...fighter, ownerId: 'someone-else' })

    const { POST } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('own fighters')
  })

  it('rejects training on an inactive fighter', async () => {
    mockPrisma.fighter.findUnique.mockResolvedValue({ ...fighter, isActive: false })

    const { POST } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('inactive')
  })

  it('rejects when fighter already has an ACTIVE session', async () => {
    mockPrisma.fighter.findUnique.mockResolvedValue(fighter)
    mockPrisma.training.findFirst.mockResolvedValue({ id: 't-existing', status: 'ACTIVE' })

    const { POST } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('active training session')
  })

  it('rejects when daily session limit reached', async () => {
    mockPrisma.fighter.findUnique.mockResolvedValue(fighter)
    mockPrisma.training.findFirst.mockResolvedValue(null) // no active session
    mockPrisma.training.count.mockResolvedValue(2) // 2 sessions today

    const { POST } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Daily training limit')
  })
})

// ─── GET /api/training/:id ──────────────────────────────────────────────────

describe('GET /api/training/:id', () => {
  it('returns training session with progress for ACTIVE session', async () => {
    const now = new Date()
    const training = {
      id: 't1', durationMinutes: 30, status: 'ACTIVE',
      startedAt: new Date(now.getTime() - 10 * 60 * 1000), // 10 min ago
      completedAt: null, hours: null, cost: null,
      strengthGain: 0, speedGain: 0, defenseGain: 0, staminaGain: 0, fightIQGain: 0, aggressionGain: 0,
      fighterId: 'f1', userId: 'u1',
      fighter: { id: 'f1', name: 'Brawler', emoji: '🥊', class: 'HEAVYWEIGHT', strength: 60, speed: 55, defense: 50, stamina: 50, fightIQ: 50, aggression: 50 },
      user: { id: 'u1', name: 'Test User', username: 'testuser' },
    }
    mockPrisma.training.findUnique.mockResolvedValue(training)

    const { GET } = await trainingDetailRoute()
    const req = createRequest('http://localhost:3000/api/training/t1')
    const res = await GET(req, params('t1'))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('t1')
    expect(data.progress).toBeGreaterThan(0)
    expect(data.progress).toBeLessThan(1)
    expect(data.isComplete).toBe(false)
  })

  it('auto-completes when time has elapsed', async () => {
    const now = new Date()
    const training = {
      id: 't1', durationMinutes: 15, status: 'ACTIVE',
      startedAt: new Date(now.getTime() - 20 * 60 * 1000), // 20 min ago (15 min session)
      completedAt: null, hours: null, cost: null,
      strengthGain: 0, speedGain: 0, defenseGain: 0, staminaGain: 0, fightIQGain: 0, aggressionGain: 0,
      fighterId: 'f1', userId: 'u1',
      fighter: { id: 'f1', name: 'Brawler', emoji: '🥊', class: 'HEAVYWEIGHT', strength: 60, speed: 55, defense: 50, stamina: 50, fightIQ: 50, aggression: 50 },
      user: { id: 'u1', name: 'Test User', username: 'testuser' },
    }
    mockPrisma.training.findUnique.mockResolvedValue(training)

    const completedTraining = {
      ...training, status: 'COMPLETED', completedAt: now,
      strengthGain: 1, // at least some gain
    }
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn({
      training: { update: jest.fn().mockResolvedValue(completedTraining) },
      fighter: { update: jest.fn() },
    }))

    const { GET } = await trainingDetailRoute()
    const req = createRequest('http://localhost:3000/api/training/t1')
    const res = await GET(req, params('t1'))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.isComplete).toBe(true)
    expect(data.progress).toBe(1)
  })

  it('returns 404 when not found', async () => {
    mockPrisma.training.findUnique.mockResolvedValue(null)

    const { GET } = await trainingDetailRoute()
    const req = createRequest('http://localhost:3000/api/training/nonexistent')
    const res = await GET(req, params('nonexistent'))

    expect(res.status).toBe(404)
  })

  it('returns 401 when unauthenticated', async () => {
    const { NextResponse } = require('next/server')
    mockRequireAnyRole.mockRejectedValue(
      Object.assign(new Error('Unauthorized'), {
        name: 'AuthRequiredError',
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      })
    )

    const { GET } = await trainingDetailRoute()
    const req = createRequest('http://localhost:3000/api/training/t1')
    const res = await GET(req, params('t1'))

    expect(res.status).toBe(401)
  })
})

// ─── PATCH /api/training/:id ────────────────────────────────────────────────

describe('PATCH /api/training/:id', () => {
  it('cancels an ACTIVE training session', async () => {
    const training = { id: 't1', status: 'ACTIVE', userId: 'u1', fighterId: 'f1' }
    mockPrisma.training.findUnique.mockResolvedValue(training)
    mockPrisma.training.update.mockResolvedValue({ ...training, status: 'CANCELLED', completedAt: new Date() })

    const { PATCH } = await trainingDetailRoute()
    const req = createRequest('http://localhost:3000/api/training/t1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, params('t1'))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('CANCELLED')
  })

  it('rejects cancel on COMPLETED session', async () => {
    const training = { id: 't1', status: 'COMPLETED', userId: 'u1', fighterId: 'f1' }
    mockPrisma.training.findUnique.mockResolvedValue(training)

    const { PATCH } = await trainingDetailRoute()
    const req = createRequest('http://localhost:3000/api/training/t1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, params('t1'))

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('completed')
  })

  it('rejects cancel on already-CANCELLED session', async () => {
    const training = { id: 't1', status: 'CANCELLED', userId: 'u1', fighterId: 'f1' }
    mockPrisma.training.findUnique.mockResolvedValue(training)

    const { PATCH } = await trainingDetailRoute()
    const req = createRequest('http://localhost:3000/api/training/t1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, params('t1'))

    expect(res.status).toBe(400)
  })

  it('returns 404 when session not found', async () => {
    mockPrisma.training.findUnique.mockResolvedValue(null)

    const { PATCH } = await trainingDetailRoute()
    const req = createRequest('http://localhost:3000/api/training/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, params('nonexistent'))

    expect(res.status).toBe(404)
  })

  it('rejects cancel on another user\'s session', async () => {
    const training = { id: 't1', status: 'ACTIVE', userId: 'other-user', fighterId: 'f1' }
    mockPrisma.training.findUnique.mockResolvedValue(training)

    const { PATCH } = await trainingDetailRoute()
    const req = createRequest('http://localhost:3000/api/training/t1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, params('t1'))

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('own training')
  })
})
