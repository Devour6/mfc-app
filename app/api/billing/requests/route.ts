import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, validationError, serverError } from '@/lib/api-utils'
import { createBillingRequestSchema } from '@/lib/validations'
import { requireAnyRole, requireAgent } from '@/lib/role-guard'

// GET /api/billing/requests — List billing requests
// Agents see their own requests. Owners see requests from their agents.
export async function GET(request: NextRequest) {
  try {
    const dbUser = await requireAnyRole()

    const where: Record<string, unknown> = {}

    if (dbUser.isAgent) {
      // Agent: find their profile and get their requests
      const profile = await prisma.agentProfile.findUnique({
        where: { userId: dbUser.id },
        select: { id: true },
      })
      if (!profile) return errorResponse('Agent profile not found', 404)
      where.agentId = profile.id
    } else {
      // Owner: see requests from agents they own
      where.ownerId = dbUser.id
    }

    const requests = await prisma.billingRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        agent: { select: { id: true, agentName: true, userId: true } },
      },
    })

    return jsonResponse(requests)
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/billing/requests — Create a billing request (agent only)
export async function POST(request: NextRequest) {
  try {
    const dbUser = await requireAgent()

    const body = await request.json()
    const parsed = createBillingRequestSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { amount, reason } = parsed.data

    // Find agent's profile and owner
    const profile = await prisma.agentProfile.findUnique({
      where: { userId: dbUser.id },
      select: { id: true, ownerId: true },
    })

    if (!profile) return errorResponse('Agent profile not found', 404)
    if (!profile.ownerId) {
      return errorResponse('No owner linked to this agent. Set an owner first.', 400)
    }

    const billingRequest = await prisma.billingRequest.create({
      data: {
        agentId: profile.id,
        ownerId: profile.ownerId,
        amount,
        reason,
      },
    })

    return jsonResponse(billingRequest, 201)
  } catch (error) {
    return serverError(error)
  }
}
