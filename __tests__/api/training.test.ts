import { createRequest, params, mockPrisma, mockRequireAgent, mockRequireAnyRole } from './helpers'

// Import route handlers
const trainingListRoute = () => import('@/app/api/training/route')
const trainingDetailRoute = () => import('@/app/api/training/[id]/route')

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireAnyRole.mockResolvedValue({ id: 'u1', auth0Id: 'auth0|test-user', credits: 10000, username: 'testuser', isAgent: false })
  mockRequireAgent.mockResolvedValue({ id: 'u-agent-1', auth0Id: 'agent_abc123def456', credits: 1000, username: null, isAgent: true })
})

// ─── GET /api/training ──────────────────────────────────────────────────────

describe('GET /api/training', () => {
  it('returns a list of training sessions', async () => {
    const trainings = [
      { id: 't1', hours: 2, cost: 200, fighterId: 'f1', userId: 'u1', fighter: { id: 'f1', name: 'Brawler', emoji: '🥊', class: 'HEAVYWEIGHT' } },
    ]
    mockPrisma.training.findMany.mockResolvedValue(trainings)

    const { GET } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual(trainings)
    expect(mockPrisma.training.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } })
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
  const validBody = { fighterId: 'f1', hours: 3 }
  const fighter = {
    id: 'f1', name: 'Brawler', ownerId: 'u-agent-1', isActive: true, trainingCost: 100,
    strength: 50, speed: 50, defense: 50, stamina: 50, fightIQ: 50, aggression: 50,
  }

  it('creates a training session (agent only)', async () => {
    mockPrisma.fighter.findUnique.mockResolvedValue(fighter)
    const createdTraining = { id: 't-new', hours: 3, cost: 300, fighterId: 'f1', userId: 'u-agent-1' }
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn({
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'u-agent-1', credits: 1000 }),
        update: jest.fn(),
      },
      training: { create: jest.fn().mockResolvedValue(createdTraining) },
      fighter: { update: jest.fn() },
    }))

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
  })

  it('returns 400 for invalid body', async () => {
    const { POST } = await trainingListRoute()
    const req = createRequest('http://localhost:3000/api/training', {
      method: 'POST',
      body: JSON.stringify({ fighterId: '', hours: 0 }),
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
})

// ─── GET /api/training/:id ──────────────────────────────────────────────────

describe('GET /api/training/:id', () => {
  it('returns training session details', async () => {
    const training = {
      id: 't1', hours: 2, cost: 200, fighterId: 'f1', userId: 'u1',
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
    expect(data.fighter.name).toBe('Brawler')
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
