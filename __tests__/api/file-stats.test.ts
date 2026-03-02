/**
 * @jest-environment node
 */
import { createRequest } from './helpers'

// Mock fs module
jest.mock('fs', () => ({
  statSync: jest.fn(),
}))

import { statSync } from 'fs'
import { GET } from '@/app/api/file-stats/route'

const mockStatSync = statSync as jest.MockedFunction<typeof statSync>

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/file-stats', () => {
  it('returns 400 when path param is missing', async () => {
    const req = createRequest('http://localhost:3000/api/file-stats')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Path parameter required')
  })

  it('returns 403 for paths outside workspace content directory', async () => {
    const req = createRequest('http://localhost:3000/api/file-stats?path=/etc/passwd')
    const res = await GET(req)
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('Access denied')
  })

  it('returns file stats for valid workspace path', async () => {
    const mockDate = new Date('2026-02-20T10:00:00Z')
    mockStatSync.mockReturnValue({
      size: 1024,
      mtime: mockDate,
      ctime: mockDate,
      isFile: () => true,
      isDirectory: () => false,
    } as unknown as ReturnType<typeof statSync>)

    const validPath = '/Users/georgeopenclaw/.openclaw/workspace/content/draft.md'
    const req = createRequest(`http://localhost:3000/api/file-stats?path=${encodeURIComponent(validPath)}`)
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.size).toBe(1024)
    expect(data.mtime).toBe('2026-02-20T10:00:00.000Z')
    expect(data.isFile).toBe(true)
    expect(data.isDirectory).toBe(false)
  })

  it('returns 404 when file does not exist', async () => {
    mockStatSync.mockImplementation(() => { throw new Error('ENOENT') })

    const validPath = '/Users/georgeopenclaw/.openclaw/workspace/content/missing.md'
    const req = createRequest(`http://localhost:3000/api/file-stats?path=${encodeURIComponent(validPath)}`)
    const res = await GET(req)

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('File not found')
  })
})
