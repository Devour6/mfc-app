import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, validationError, serverError } from '@/lib/api-utils'
import { validateChallenge } from '@/lib/reverse-captcha'
import { registerAgentSchema } from '@/lib/validations'
import { RateLimiter, checkRateLimit } from '@/lib/rate-limit'

// Strict rate limit for registration: 3 per hour per IP
export const registrationLimiter = new RateLimiter({ maxRequests: 3, windowMs: 60 * 60 * 1000 })

// POST /api/agents/register — Register an AI agent and receive an API key
export async function POST(request: Request) {
  // Rate limit by IP — registration is unauthenticated so we can't use userId
  const rateLimited = checkRateLimit(registrationLimiter, request)
  if (rateLimited) return rateLimited

  try {
    const body = await request.json()
    const parsed = registerAgentSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { name, description, moltbookToken, challengeId, challengeAnswer } = parsed.data

    // Validate reverse CAPTCHA challenge
    const challengeResult = validateChallenge(challengeId, challengeAnswer)
    if (!challengeResult.valid) {
      return errorResponse(challengeResult.error || 'Challenge validation failed', 403)
    }

    // Optional: verify Moltbook identity token
    let moltbookId: string | null = null
    if (moltbookToken) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        const resp = await fetch('https://api.moltbook.com/api/v1/agents/verify-identity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Moltbook-Identity': moltbookToken,
          },
          body: JSON.stringify({ token: moltbookToken }),
          signal: controller.signal,
        })
        clearTimeout(timeout)
        if (resp.ok) {
          const data = await resp.json()
          moltbookId = data.agentId ?? data.agent_id ?? null

          // Prevent duplicate Moltbook agents
          if (moltbookId) {
            const existing = await prisma.agentProfile.findUnique({
              where: { moltbookId },
            })
            if (existing) {
              return errorResponse('This Moltbook agent already has an MFC account', 409)
            }
          }
        }
      } catch {
        // Moltbook unreachable or timed out — proceed without verification
      }
    }

    // Generate synthetic auth0Id (agent_ prefix never collides with Auth0's auth0| or google-oauth2| patterns)
    const agentAuthId = `agent_${randomBytes(16).toString('hex')}`
    const agentEmail = `${agentAuthId}@agent.mfc.gg`

    // Generate API key: mfc_sk_ prefix + 64 hex chars (256 bits entropy)
    const apiKeyValue = `mfc_sk_${randomBytes(32).toString('hex')}`

    // Create user + agent profile + API key in one transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          auth0Id: agentAuthId,
          email: agentEmail,
          name,
          isAgent: true,
        },
      })

      await tx.agentProfile.create({
        data: {
          userId: user.id,
          agentName: name,
          description: description ?? null,
          moltbookId,
        },
      })

      await tx.apiKey.create({
        data: {
          key: apiKeyValue,
          userId: user.id,
          name: 'default',
        },
      })

      return user
    })

    return jsonResponse({
      userId: result.id,
      agentName: name,
      apiKey: apiKeyValue,
      credits: result.credits,
      moltbookVerified: !!moltbookId,
      message: 'Agent registered successfully. Save your API key — it will not be shown again.',
    }, 201)
  } catch (error) {
    return serverError(error)
  }
}
