import { mockPrisma } from './helpers'

// Mock @/lib/stripe
const mockConstructEvent = jest.fn()
const mockGetCreditPackage = jest.fn()
jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: mockConstructEvent },
  },
  getCreditPackage: mockGetCreditPackage,
  CREDIT_PACKAGES: [
    { id: 'credits-500', credits: 500, priceInCents: 499, label: '500 Credits' },
  ],
}))

const webhookRoute = () => import('@/app/api/stripe/webhook/route')

beforeEach(() => {
  jest.clearAllMocks()
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
})

describe('POST /api/stripe/webhook', () => {
  it('returns 400 when stripe-signature header is missing', async () => {
    const { POST } = await webhookRoute()
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'payload',
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('stripe-signature')
  })

  it('returns 500 when webhook secret is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET

    const { POST } = await webhookRoute()
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'payload',
      headers: { 'stripe-signature': 'sig_test' },
    })
    const res = await POST(req)

    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toContain('not configured')
  })

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const { POST } = await webhookRoute()
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'payload',
      headers: { 'stripe-signature': 'bad_sig' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Invalid signature')
  })

  it('handles checkout.session.completed and credits the user', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: { userId: 'u1', packageId: 'credits-500', credits: '500' },
        },
      },
    }
    mockConstructEvent.mockReturnValue(event)
    mockGetCreditPackage.mockReturnValue({ id: 'credits-500', credits: 500 })
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn({
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'u1', credits: 1000 }),
        update: jest.fn(),
      },
    }))

    const { POST } = await webhookRoute()
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: { 'stripe-signature': 'valid_sig' },
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.received).toBe(true)
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('handles checkout.session.completed with missing metadata gracefully', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: { id: 'cs_test_456', metadata: {} },
      },
    }
    mockConstructEvent.mockReturnValue(event)

    const { POST } = await webhookRoute()
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: { 'stripe-signature': 'valid_sig' },
    })
    const res = await POST(req)

    // Should still return 200 (received) — missing metadata just skips crediting
    expect(res.status).toBe(200)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('handles unhandled event types', async () => {
    mockConstructEvent.mockReturnValue({ type: 'payment_intent.created', data: {} })

    const { POST } = await webhookRoute()
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'payload',
      headers: { 'stripe-signature': 'valid_sig' },
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.received).toBe(true)
  })
})
