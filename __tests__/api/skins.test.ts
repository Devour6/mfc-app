/**
 * @jest-environment node
 */
import { mockPrisma, createRequest, params, mockRequireHuman } from './helpers'

import { GET } from '@/app/api/skins/route'
import { POST } from '@/app/api/skins/purchase/route'
import { GET as GET_FIGHTER_SKINS } from '@/app/api/fighters/[id]/skins/route'

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET /api/skins ──────────────────────────────────────────────────────────

describe('GET /api/skins', () => {
  it('returns skins list', async () => {
    const skins = [
      { id: 's1', name: 'Fire Gloves', type: 'GLOVES', rarity: 'RARE', priceCredits: 500 },
    ]
    mockPrisma.skin.findMany.mockResolvedValue(skins)

    const res = await GET(createRequest('/api/skins'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(skins)
  })

  it('filters by type and rarity', async () => {
    mockPrisma.skin.findMany.mockResolvedValue([])

    await GET(createRequest('/api/skins?type=GLOVES&rarity=RARE'))

    expect(mockPrisma.skin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'GLOVES', rarity: 'RARE' }),
      })
    )
  })

  it('rejects invalid type', async () => {
    const res = await GET(createRequest('/api/skins?type=INVALID'))
    expect(res.status).toBe(400)
  })
})

// ─── POST /api/skins/purchase ────────────────────────────────────────────────

describe('POST /api/skins/purchase', () => {
  const mockSkin = { id: 's1', name: 'Fire Gloves', type: 'GLOVES', rarity: 'RARE', priceCredits: 500 }
  const mockFighter = { id: 'f1', name: 'TestBot' }

  it('purchases a skin and deducts credits', async () => {
    mockPrisma.skin.findUnique.mockResolvedValue(mockSkin)
    mockPrisma.fighter.findUnique.mockResolvedValue(mockFighter)
    mockPrisma.skinPurchase.findUnique.mockResolvedValue(null)

    const createdPurchase = { id: 'sp1', skinId: 's1', fighterId: 'f1', equipped: true, skin: mockSkin }
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', credits: 10000 })
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', credits: 9500 })
    mockPrisma.skinPurchase.create.mockResolvedValue(createdPurchase)

    const res = await POST(
      createRequest('/api/skins/purchase', {
        method: 'POST',
        body: JSON.stringify({ skinId: 's1', fighterId: 'f1' }),
      })
    )

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.skinId).toBe('s1')
  })

  it('returns 404 for non-existent skin', async () => {
    mockPrisma.skin.findUnique.mockResolvedValue(null)

    const res = await POST(
      createRequest('/api/skins/purchase', {
        method: 'POST',
        body: JSON.stringify({ skinId: 'nonexistent', fighterId: 'f1' }),
      })
    )

    expect(res.status).toBe(404)
  })

  it('returns 409 for duplicate purchase', async () => {
    mockPrisma.skin.findUnique.mockResolvedValue(mockSkin)
    mockPrisma.fighter.findUnique.mockResolvedValue(mockFighter)
    mockPrisma.skinPurchase.findUnique.mockResolvedValue({ id: 'existing' })

    const res = await POST(
      createRequest('/api/skins/purchase', {
        method: 'POST',
        body: JSON.stringify({ skinId: 's1', fighterId: 'f1' }),
      })
    )

    expect(res.status).toBe(409)
  })

  it('returns 400 for insufficient credits', async () => {
    mockPrisma.skin.findUnique.mockResolvedValue(mockSkin)
    mockPrisma.fighter.findUnique.mockResolvedValue(mockFighter)
    mockPrisma.skinPurchase.findUnique.mockResolvedValue(null)
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', credits: 100 })

    const res = await POST(
      createRequest('/api/skins/purchase', {
        method: 'POST',
        body: JSON.stringify({ skinId: 's1', fighterId: 'f1' }),
      })
    )

    expect(res.status).toBe(400)
  })

  it('returns 401 without auth', async () => {
    const { RoleForbiddenError } = jest.requireMock('@/lib/role-guard')
    mockRequireHuman.mockRejectedValueOnce(new RoleForbiddenError('human'))

    const res = await POST(
      createRequest('/api/skins/purchase', {
        method: 'POST',
        body: JSON.stringify({ skinId: 's1', fighterId: 'f1' }),
      })
    )

    expect(res.status).toBe(403)
  })

  it('rejects invalid payload', async () => {
    const res = await POST(
      createRequest('/api/skins/purchase', {
        method: 'POST',
        body: JSON.stringify({ skinId: '', fighterId: '' }),
      })
    )

    expect(res.status).toBe(400)
  })
})

// ─── GET /api/fighters/:id/skins ─────────────────────────────────────────────

describe('GET /api/fighters/:id/skins', () => {
  it('returns equipped skins for a fighter', async () => {
    mockPrisma.fighter.findUnique.mockResolvedValue({ id: 'f1', name: 'TestBot' })
    const skins = [
      { id: 'sp1', skinId: 's1', equipped: true, skin: { name: 'Fire Gloves' } },
    ]
    mockPrisma.skinPurchase.findMany.mockResolvedValue(skins)

    const res = await GET_FIGHTER_SKINS(createRequest('/api/fighters/f1/skins'), params('f1'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(skins)
  })

  it('returns 404 for non-existent fighter', async () => {
    mockPrisma.fighter.findUnique.mockResolvedValue(null)

    const res = await GET_FIGHTER_SKINS(createRequest('/api/fighters/bad/skins'), params('bad'))

    expect(res.status).toBe(404)
  })
})
