// No auth, no prisma — just env vars
// Must mock @/lib/prisma and @/lib/auth0 to prevent import errors
jest.mock('@/lib/prisma', () => ({ prisma: {} }))
jest.mock('@/lib/auth0', () => ({ auth0: {} }))

const solanaConfigRoute = () => import('@/app/api/solana/config/route')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/solana/config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns treasury wallet and credits-per-SOL rate', async () => {
    process.env.MFC_TREASURY_WALLET = 'SoLaNa1234567890abcdef'
    process.env.MFC_CREDITS_PER_SOL = '500'

    const { GET } = await solanaConfigRoute()
    const res = await GET()

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.treasuryWallet).toBe('SoLaNa1234567890abcdef')
    expect(data.creditsPerSol).toBe(500)
  })

  it('returns 503 when treasury wallet is not configured', async () => {
    delete process.env.MFC_TREASURY_WALLET

    const { GET } = await solanaConfigRoute()
    const res = await GET()

    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.error).toContain('not configured')
  })

  it('defaults creditsPerSol to 1000 when env var is not set', async () => {
    process.env.MFC_TREASURY_WALLET = 'SoLaNa1234567890abcdef'
    delete process.env.MFC_CREDITS_PER_SOL

    const { GET } = await solanaConfigRoute()
    const res = await GET()

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.creditsPerSol).toBe(1000)
  })
})
