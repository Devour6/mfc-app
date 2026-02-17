/**
 * @jest-environment node
 */
import { mockPrisma, createRequest } from './helpers'

import { GET } from '@/app/api/health/route'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/health', () => {
  it('returns ok with db connected', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }])

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.db).toBe('connected')
    expect(data.timestamp).toBeDefined()
  })

  it('returns ok with db disconnected on error', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'))

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.db).toBe('disconnected')
  })
})
