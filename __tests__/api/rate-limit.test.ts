/**
 * @jest-environment node
 */
import { RateLimiter, getRateLimitKey, checkRateLimit } from '@/lib/rate-limit'

// ─── RateLimiter class ──────────────────────────────────────────────────────

describe('RateLimiter', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 })
  })

  it('allows requests under the limit', () => {
    expect(limiter.check('user:1')).toEqual({ allowed: true })
    expect(limiter.check('user:1')).toEqual({ allowed: true })
    expect(limiter.check('user:1')).toEqual({ allowed: true })
  })

  it('blocks requests over the limit', () => {
    limiter.check('user:1')
    limiter.check('user:1')
    limiter.check('user:1')
    const result = limiter.check('user:1')
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.retryAfterMs).toBeGreaterThan(0)
      expect(result.retryAfterMs).toBeLessThanOrEqual(1000)
    }
  })

  it('tracks keys independently', () => {
    limiter.check('user:1')
    limiter.check('user:1')
    limiter.check('user:1')
    // user:1 is at limit
    expect(limiter.check('user:1').allowed).toBe(false)
    // user:2 is still fine
    expect(limiter.check('user:2').allowed).toBe(true)
  })

  it('allows requests after window expires', async () => {
    // Use a short window for this test
    const fastLimiter = new RateLimiter({ maxRequests: 1, windowMs: 50 })
    fastLimiter.check('user:1')
    expect(fastLimiter.check('user:1').allowed).toBe(false)

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(fastLimiter.check('user:1').allowed).toBe(true)
  })

  it('reset() clears all entries', () => {
    limiter.check('user:1')
    limiter.check('user:1')
    limiter.check('user:1')
    expect(limiter.check('user:1').allowed).toBe(false)

    limiter.reset()
    expect(limiter.check('user:1').allowed).toBe(true)
  })
})

// ─── getRateLimitKey ────────────────────────────────────────────────────────

describe('getRateLimitKey', () => {
  function makeRequest(headers: Record<string, string> = {}): Request {
    return new Request('http://localhost:3000/api/test', {
      headers: new Headers(headers),
    })
  }

  it('uses userId when provided', () => {
    const key = getRateLimitKey(makeRequest(), 'u1')
    expect(key).toBe('user:u1')
  })

  it('falls back to x-forwarded-for header', () => {
    const key = getRateLimitKey(makeRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))
    expect(key).toBe('ip:1.2.3.4')
  })

  it('falls back to x-real-ip header', () => {
    const key = getRateLimitKey(makeRequest({ 'x-real-ip': '9.8.7.6' }))
    expect(key).toBe('ip:9.8.7.6')
  })

  it('returns ip:unknown when no identity available', () => {
    const key = getRateLimitKey(makeRequest())
    expect(key).toBe('ip:unknown')
  })

  it('prefers userId over IP headers', () => {
    const key = getRateLimitKey(makeRequest({ 'x-forwarded-for': '1.2.3.4' }), 'u1')
    expect(key).toBe('user:u1')
  })
})

// ─── checkRateLimit ─────────────────────────────────────────────────────────

describe('checkRateLimit', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter({ maxRequests: 2, windowMs: 60000 })
  })

  function makeRequest(): Request {
    return new Request('http://localhost:3000/api/test')
  }

  it('returns null when under limit', () => {
    const result = checkRateLimit(limiter, makeRequest(), 'u1')
    expect(result).toBeNull()
  })

  it('returns 429 response when over limit', async () => {
    checkRateLimit(limiter, makeRequest(), 'u1')
    checkRateLimit(limiter, makeRequest(), 'u1')
    const response = checkRateLimit(limiter, makeRequest(), 'u1')

    expect(response).not.toBeNull()
    expect(response!.status).toBe(429)
    expect(response!.headers.get('Retry-After')).toBeTruthy()

    const body = await response!.json()
    expect(body.error).toBe('Too many requests')
    expect(body.retryAfter).toBeGreaterThan(0)
  })

  it('includes Retry-After header in seconds', async () => {
    checkRateLimit(limiter, makeRequest(), 'u1')
    checkRateLimit(limiter, makeRequest(), 'u1')
    const response = checkRateLimit(limiter, makeRequest(), 'u1')

    const retryAfter = Number(response!.headers.get('Retry-After'))
    expect(retryAfter).toBeGreaterThan(0)
    expect(retryAfter).toBeLessThanOrEqual(60)
  })
})
