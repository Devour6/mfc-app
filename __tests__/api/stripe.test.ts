/**
 * @jest-environment node
 *
 * Stripe checkout + webhook tests — verifies:
 * 1. POST /api/stripe/checkout-session creates a Stripe session for valid packages
 * 2. POST /api/stripe/checkout-session rejects invalid packageId
 * 3. POST /api/stripe/checkout-session requires authentication
 * 4. POST /api/stripe/webhook credits user on checkout.session.completed
 * 5. POST /api/stripe/webhook rejects invalid signatures
 * 6. POST /api/stripe/webhook handles missing metadata gracefully
 */

import {
  mockPrisma,
  mockRequireAnyRole,
  createRequest,
} from './helpers'

// ─── Stripe mock ────────────────────────────────────────────────────────────

const mockSessionCreate = jest.fn()
const mockWebhookConstructEvent = jest.fn()

jest.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockSessionCreate(...args),
      },
    },
    webhooks: {
      constructEvent: (...args: unknown[]) => mockWebhookConstructEvent(...args),
    },
  },
  getCreditPackage: jest.requireActual('@/lib/stripe').getCreditPackage,
  CREDIT_PACKAGES: jest.requireActual('@/lib/stripe').CREDIT_PACKAGES,
}))

import { POST as checkoutPost } from '@/app/api/stripe/checkout-session/route'
import { POST as webhookPost } from '@/app/api/stripe/webhook/route'

// ─── Fixtures ───────────────────────────────────────────────────────────────

const TEST_USER = { id: 'u1', auth0Id: 'auth0|test', credits: 10000, isAgent: false }

// ─── Checkout Session Tests ─────────────────────────────────────────────────

describe('POST /api/stripe/checkout-session', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAnyRole.mockResolvedValue(TEST_USER)
  })

  it('creates a checkout session for a valid package', async () => {
    mockSessionCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    })

    const req = createRequest('http://localhost:3000/api/stripe/checkout-session', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'credits-500' }),
    })

    const res = await checkoutPost(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.sessionId).toBe('cs_test_123')
    expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_123')

    // Verify Stripe was called with correct params
    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: 'usd',
              unit_amount: 499,
            }),
            quantity: 1,
          }),
        ],
        metadata: {
          userId: 'u1',
          packageId: 'credits-500',
          credits: '500',
        },
      }),
    )
  })

  it('rejects an invalid package ID', async () => {
    const req = createRequest('http://localhost:3000/api/stripe/checkout-session', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'credits-999999' }),
    })

    const res = await checkoutPost(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid package ID')
    expect(mockSessionCreate).not.toHaveBeenCalled()
  })

  it('rejects an empty package ID', async () => {
    const req = createRequest('http://localhost:3000/api/stripe/checkout-session', {
      method: 'POST',
      body: JSON.stringify({ packageId: '' }),
    })

    const res = await checkoutPost(req)

    expect(res.status).toBe(400)
    expect(mockSessionCreate).not.toHaveBeenCalled()
  })

  it('rejects a missing package ID', async () => {
    const req = createRequest('http://localhost:3000/api/stripe/checkout-session', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const res = await checkoutPost(req)

    expect(res.status).toBe(400)
    expect(mockSessionCreate).not.toHaveBeenCalled()
  })

  it('creates sessions for all 4 credit packages', async () => {
    const packages = ['credits-500', 'credits-1200', 'credits-3000', 'credits-7500']
    const expectedPrices = [499, 999, 1999, 4999]
    const expectedCredits = [500, 1200, 3000, 7500]

    for (let i = 0; i < packages.length; i++) {
      mockSessionCreate.mockResolvedValue({ id: `cs_${i}`, url: `https://stripe/${i}` })

      const req = createRequest('http://localhost:3000/api/stripe/checkout-session', {
        method: 'POST',
        body: JSON.stringify({ packageId: packages[i] }),
      })

      const res = await checkoutPost(req)
      expect(res.status).toBe(200)

      expect(mockSessionCreate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: expectedPrices[i],
              }),
            }),
          ],
          metadata: expect.objectContaining({
            credits: String(expectedCredits[i]),
          }),
        }),
      )
    }
  })

  it('requires authentication', async () => {
    const { RoleForbiddenError } = jest.requireMock('@/lib/role-guard') as {
      RoleForbiddenError: new (role: 'human' | 'agent') => Error & { response: Response }
    }
    mockRequireAnyRole.mockRejectedValue(new RoleForbiddenError('human'))

    const req = createRequest('http://localhost:3000/api/stripe/checkout-session', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'credits-500' }),
    })

    const res = await checkoutPost(req)
    expect(res.status).toBe(403)
    expect(mockSessionCreate).not.toHaveBeenCalled()
  })
})

// ─── Webhook Tests ──────────────────────────────────────────────────────────

describe('POST /api/stripe/webhook', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, STRIPE_WEBHOOK_SECRET: 'whsec_test_secret' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('credits user on checkout.session.completed', async () => {
    mockWebhookConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {
            userId: 'u1',
            packageId: 'credits-500',
            credits: '500',
          },
        },
      },
    })

    // Mock the Prisma transaction
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
      return fn(mockPrisma)
    })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', credits: 10000 })
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', credits: 10500 })

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'raw-stripe-body',
      headers: { 'stripe-signature': 'sig_test_123' },
    })

    const res = await webhookPost(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.received).toBe(true)

    // Verify signature was checked
    expect(mockWebhookConstructEvent).toHaveBeenCalledWith(
      'raw-stripe-body',
      'sig_test_123',
      'whsec_test_secret',
    )

    // Verify user was credited
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { credits: 10500 },
    })
  })

  it('rejects requests without stripe-signature header', async () => {
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'raw-stripe-body',
    })

    const res = await webhookPost(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Missing stripe-signature header')
  })

  it('rejects invalid signatures', async () => {
    mockWebhookConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'tampered-body',
      headers: { 'stripe-signature': 'bad_sig' },
    })

    const res = await webhookPost(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid signature')
  })

  it('returns 500 when STRIPE_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'raw-stripe-body',
      headers: { 'stripe-signature': 'sig_test_123' },
    })

    const res = await webhookPost(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Webhook not configured')
  })

  it('handles missing metadata gracefully', async () => {
    mockWebhookConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_no_meta',
          metadata: {},
        },
      },
    })

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'raw-stripe-body',
      headers: { 'stripe-signature': 'sig_test_123' },
    })

    const res = await webhookPost(req)
    const data = await res.json()

    // Should still return 200 (ack the event) but not credit anyone
    expect(res.status).toBe(200)
    expect(data.received).toBe(true)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('handles invalid package ID in metadata gracefully', async () => {
    mockWebhookConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_bad_pkg',
          metadata: {
            userId: 'u1',
            packageId: 'credits-nonexistent',
            credits: '999',
          },
        },
      },
    })

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'raw-stripe-body',
      headers: { 'stripe-signature': 'sig_test_123' },
    })

    const res = await webhookPost(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.received).toBe(true)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('handles unrelated webhook events without error', async () => {
    mockWebhookConstructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test' } },
    })

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'raw-stripe-body',
      headers: { 'stripe-signature': 'sig_test_123' },
    })

    const res = await webhookPost(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.received).toBe(true)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('handles user not found in database', async () => {
    mockWebhookConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_no_user',
          metadata: {
            userId: 'u-nonexistent',
            packageId: 'credits-500',
            credits: '500',
          },
        },
      },
    })

    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
      return fn(mockPrisma)
    })
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'raw-stripe-body',
      headers: { 'stripe-signature': 'sig_test_123' },
    })

    const res = await webhookPost(req)
    const data = await res.json()

    // Should still return 200 (ack) but not update
    expect(res.status).toBe(200)
    expect(data.received).toBe(true)
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })
})
