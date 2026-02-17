/**
 * @jest-environment node
 */
import { mockPrisma, createRequest, params } from './helpers'

import { GET, POST } from '@/app/api/fighters/route'
import { GET as GET_BY_ID, PATCH } from '@/app/api/fighters/[id]/route'

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET /api/fighters ──────────────────────────────────────────────────────

describe('GET /api/fighters', () => {
  it('returns all fighters ordered by elo', async () => {
    const fighters = [
      { id: 'f1', name: 'Iron Mike', elo: 1200 },
      { id: 'f2', name: 'Glass Joe', elo: 900 },
    ]
    mockPrisma.fighter.findMany.mockResolvedValue(fighters)

    const res = await GET(createRequest('/api/fighters'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(fighters)
    expect(mockPrisma.fighter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { elo: 'desc' } })
    )
  })

  it('filters by ownerId', async () => {
    mockPrisma.fighter.findMany.mockResolvedValue([])

    await GET(createRequest('/api/fighters?ownerId=user1'))

    expect(mockPrisma.fighter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ownerId: 'user1' }) })
    )
  })

  it('filters by class', async () => {
    mockPrisma.fighter.findMany.mockResolvedValue([])

    await GET(createRequest('/api/fighters?class=HEAVYWEIGHT'))

    expect(mockPrisma.fighter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ class: 'HEAVYWEIGHT' }) })
    )
  })
})

// ─── POST /api/fighters ─────────────────────────────────────────────────────

describe('POST /api/fighters', () => {
  it('creates a fighter with valid data', async () => {
    const created = { id: 'f1', name: 'Iron Mike', emoji: '🥊', class: 'HEAVYWEIGHT', ownerId: 'u1' }
    mockPrisma.fighter.create.mockResolvedValue(created)

    const res = await POST(
      createRequest('/api/fighters', {
        method: 'POST',
        body: JSON.stringify({ name: 'Iron Mike', emoji: '🥊', fighterClass: 'HEAVYWEIGHT', ownerId: 'u1' }),
      })
    )
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.name).toBe('Iron Mike')
  })

  it('returns 400 for missing required fields', async () => {
    const res = await POST(
      createRequest('/api/fighters', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      })
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Validation failed')
  })
})

// ─── GET /api/fighters/:id ──────────────────────────────────────────────────

describe('GET /api/fighters/:id', () => {
  it('returns fighter with stats', async () => {
    const fighter = { id: 'f1', name: 'Iron Mike', elo: 1200, trainings: [], fightResults: [] }
    mockPrisma.fighter.findUnique.mockResolvedValue(fighter)

    const res = await GET_BY_ID(createRequest('/api/fighters/f1'), params('f1'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.name).toBe('Iron Mike')
  })

  it('returns 404 for missing fighter', async () => {
    mockPrisma.fighter.findUnique.mockResolvedValue(null)

    const res = await GET_BY_ID(createRequest('/api/fighters/nope'), params('nope'))

    expect(res.status).toBe(404)
  })
})

// ─── PATCH /api/fighters/:id ────────────────────────────────────────────────

describe('PATCH /api/fighters/:id', () => {
  it('updates fighter stats', async () => {
    mockPrisma.fighter.findUnique.mockResolvedValue({ id: 'f1', name: 'Iron Mike' })
    mockPrisma.fighter.update.mockResolvedValue({ id: 'f1', name: 'Iron Mike', elo: 1250 })

    const res = await PATCH(
      createRequest('/api/fighters/f1', {
        method: 'PATCH',
        body: JSON.stringify({ elo: 1250 }),
      }),
      params('f1')
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.elo).toBe(1250)
  })

  it('returns 404 for missing fighter', async () => {
    mockPrisma.fighter.findUnique.mockResolvedValue(null)

    const res = await PATCH(
      createRequest('/api/fighters/nope', {
        method: 'PATCH',
        body: JSON.stringify({ elo: 1000 }),
      }),
      params('nope')
    )

    expect(res.status).toBe(404)
  })
})
