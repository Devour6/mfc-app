/**
 * In-memory sliding window rate limiter.
 *
 * Tracks request timestamps per key (user ID or IP). Prunes expired entries
 * on each check. Not suitable for multi-instance deployments — use Redis
 * or a similar shared store for production horizontal scaling.
 */

interface RateLimitEntry {
  timestamps: number[]
}

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Window duration in milliseconds */
  windowMs: number
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  /**
   * Check if a request should be allowed.
   * Returns { allowed: true } or { allowed: false, retryAfterMs }.
   */
  check(key: string): { allowed: true } | { allowed: false; retryAfterMs: number } {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    let entry = this.store.get(key)
    if (!entry) {
      entry = { timestamps: [] }
      this.store.set(key, entry)
    }

    // Prune expired timestamps
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

    if (entry.timestamps.length >= this.config.maxRequests) {
      // Earliest timestamp that will expire
      const oldestInWindow = entry.timestamps[0]
      const retryAfterMs = oldestInWindow + this.config.windowMs - now
      return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1) }
    }

    entry.timestamps.push(now)
    return { allowed: true }
  }

  /** Remove all entries (useful for testing) */
  reset() {
    this.store.clear()
  }
}

// ─── Pre-configured limiters for API routes ──────────────────────────────────

/** 10 requests per minute — for fighters, fights, training POST routes */
export const standardLimiter = new RateLimiter({ maxRequests: 10, windowMs: 60_000 })

/** 20 requests per minute — for bets POST route (higher volume) */
export const betsLimiter = new RateLimiter({ maxRequests: 20, windowMs: 60_000 })

// ─── Helper to extract rate limit key from request ───────────────────────────

/**
 * Get a rate limit key from the request.
 * Uses userId if provided (authenticated), falls back to IP.
 */
export function getRateLimitKey(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`

  // Try common headers for proxied IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return `ip:${forwarded.split(',')[0].trim()}`

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return `ip:${realIp}`

  return 'ip:unknown'
}

/**
 * Check rate limit and return a 429 response if exceeded.
 * Returns null if the request is allowed.
 */
export function checkRateLimit(
  limiter: RateLimiter,
  request: Request,
  userId?: string
): Response | null {
  const key = getRateLimitKey(request, userId)
  const result = limiter.check(key)

  if (!result.allowed) {
    const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000)
    return new Response(
      JSON.stringify({ error: 'Too many requests', retryAfter: retryAfterSeconds }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfterSeconds),
        },
      }
    )
  }

  return null
}
