import { createRequest, mockRequireAnyRole } from './helpers'

// Mock @/lib/stripe
const mockSessionsCreate = jest.fn()
const mockGetCreditPackage = jest.fn()
jest.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { create: mockSessionsCreate } },
  },
  getCreditPackage: mockGetCreditPackage,
  CREDIT_PACKAGES: [
    { id: 'credits-500', credits: 500, priceInCents: 499, label: '500 Credits' },
  ],
}))

const checkoutRoute = () => import('@/app/api/stripe/checkout-session/route')

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireAnyRole.mockResolvedValue({ id: 'u1', auth0Id: 'auth0|test-user', credits: 10000, username: 'testuser', isAgent: false })
})

describe('POST /api/stripe/checkout-session', () => {
  it('creates a Stripe Checkout Session for a valid package', async () => {
    mockGetCreditPackage.mockReturnValue({ id: 'credits-500', credits: 500, priceInCents: 499, label: '500 Credits' })
    mockSessionsCreate.mockResolvedValue({ id: 'cs_test_123', url: 'https://checkout.stripe.com/session/cs_test_123' })

    const { POST } = await checkoutRoute()
    const req = createRequest('http://localhost:3000/api/stripe/checkout-session', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'credits-500' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.sessionId).toBe('cs_test_123')
    expect(data.url).toContain('stripe.com')
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        metadata: expect.objectContaining({ userId: 'u1', packageId: 'credits-500' }),
      })
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

    const { POST } = await checkoutRoute()
    const req = createRequest('http://localhost:3000/api/stripe/checkout-session', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'credits-500' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it('returns 400 for missing packageId', async () => {
    const { POST } = await checkoutRoute()
    const req = createRequest('http://localhost:3000/api/stripe/checkout-session', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid packageId', async () => {
    mockGetCreditPackage.mockReturnValue(undefined)

    const { POST } = await checkoutRoute()
    const req = createRequest('http://localhost:3000/api/stripe/checkout-session', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'fake-package' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Invalid package')
  })
})
