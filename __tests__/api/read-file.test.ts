/**
 * @jest-environment node
 */
import { createRequest } from './helpers'

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}))

import { readFileSync } from 'fs'
import { GET } from '@/app/api/read-file/route'

const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/read-file', () => {
  it('returns 400 when path param is missing', async () => {
    const req = createRequest('http://localhost:3000/api/read-file')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Path parameter required')
  })

  it('returns 403 for paths outside workspace content directory', async () => {
    const req = createRequest('http://localhost:3000/api/read-file?path=/etc/passwd')
    const res = await GET(req)
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('Access denied')
  })

  it('returns file content for valid workspace path', async () => {
    const content = '# Draft Title\nSome content here'
    mockReadFileSync.mockReturnValue(content)

    const validPath = '/Users/georgeopenclaw/.openclaw/workspace/content/draft.md'
    const req = createRequest(`http://localhost:3000/api/read-file?path=${encodeURIComponent(validPath)}`)
    const res = await GET(req)

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toBe(content)
  })

  it('returns 404 when file does not exist', async () => {
    mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT') })

    const validPath = '/Users/georgeopenclaw/.openclaw/workspace/content/missing.md'
    const req = createRequest(`http://localhost:3000/api/read-file?path=${encodeURIComponent(validPath)}`)
    const res = await GET(req)

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('File not found')
  })
})
