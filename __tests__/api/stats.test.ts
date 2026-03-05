import { createRequest, mockPrisma } from './helpers'
import { GET } from '@/app/api/stats/route'

describe('GET /api/stats', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns fighter count, live fights, and volume', async () => {
    mockPrisma.fighter.count.mockResolvedValue(42)
    mockPrisma.fight.count.mockResolvedValue(3)
    mockPrisma.trade.aggregate.mockResolvedValue({ _sum: { quantity: 150 } })
    mockPrisma.$queryRaw.mockResolvedValue([{ total: BigInt(250000) }])

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.activeFighters).toBe(42)
    expect(data.liveFights).toBe(3)
    expect(data.totalVolumeCents).toBe(250000)
  })

  it('returns zeros on DB error', async () => {
    mockPrisma.fighter.count.mockRejectedValue(new Error('DB down'))

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.activeFighters).toBe(0)
    expect(data.liveFights).toBe(0)
    expect(data.totalVolumeCents).toBe(0)
  })

  it('handles zero volume gracefully', async () => {
    mockPrisma.fighter.count.mockResolvedValue(0)
    mockPrisma.fight.count.mockResolvedValue(0)
    mockPrisma.trade.aggregate.mockResolvedValue({ _sum: { quantity: null } })
    mockPrisma.$queryRaw.mockResolvedValue([{ total: BigInt(0) }])

    const res = await GET()
    const data = await res.json()

    expect(data.activeFighters).toBe(0)
    expect(data.liveFights).toBe(0)
    expect(data.totalVolumeCents).toBe(0)
  })
})
